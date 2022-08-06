import { RequestInterceptorOptions, SingleIntegrationData } from '@app/definitions/definition'
import { MultiIntegrationDefinition } from '@app/definitions/multi-integration.definition'
import { IntegrationAuthDefinition, IntegrationAuthType } from '@app/definitions/typings/IntegrationAuthDefinition'
import { HttpService } from '@nestjs/axios'
import { Logger } from '@nestjs/common'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import aws4 from 'aws4'
import { Request } from 'express'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'
import pluralize from 'pluralize'
import request from 'request'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

interface NormalAPIDefinition {
  version: string
  metadata: {
    apiVersion: string
    endpointPrefix: string
    jsonVersion: string
    protocol: string
    serviceFullName: string
    serviceAbbreviation?: string
    serviceId: string
    signatureVersion: string
    targetPrefix: string
    uid: string
  }
  operations: {
    [key: string]: {
      name: string
      http: {
        method: 'GET' | 'POST' | 'UPDATE' | 'DELETE'
        requestUri: string
      }
      input?: unknown
      output?: unknown
      errors: unknown[]
      documentation?: string
    }
  }
  shapes: {
    [key: string]: unknown
  }
}

export class AwsDefinition extends MultiIntegrationDefinition {
  protected readonly logger = new Logger(AwsDefinition.name)
  protected integrationAccount: IntegrationAccount | undefined

  readonly parentKey = 'aws'
  readonly parentName = 'AWS'
  allowedTriggerMethods = ['get', 'post']

  // Map auto-generated integration keys (for endpoints that changed between versions)
  integrationKeyMap = {
    'aws-cloudhsmv2': 'aws-cloudhsm',
    'aws-macie2': 'aws-macie',
    'aws-waf-regional': 'aws-waf',
    'aws-wafv2': 'aws-waf',
  }

  // Skip non existent integration services
  skipKeys = ['aws-mturk-requester', 'aws-devops-guru', 'aws-airflow']

  get triggerNamePrefixes(): string[] {
    return [...this._triggerNamePrefixes, 'describe']
  }

  /**
   * Create a single integration account which will be shared between all AWS integrations
   */
  async createOrUpdateIntegrationAccount(): Promise<IntegrationAccount | null> {
    if (!this.integrationAccount) {
      const authDefinition: IntegrationAuthDefinition = {
        authType: IntegrationAuthType.http,
        schema: {
          type: 'object',
          required: ['region', 'accessKeyId', 'secretAccessKey'],
          exposed: ['region'],
          properties: {
            region: {
              type: 'string',
              title: 'Region',
              // enum: [], // TODO
              default: 'us-east-1',
            },
            accessKeyId: {
              type: 'string',
              title: 'Access key ID',
              format: 'password',
            },
            secretAccessKey: {
              type: 'string',
              title: 'Secret access key',
              format: 'password',
            },
          },
        },
      }

      this.logger.debug(`Creating or updating integration account for ${this.parentKey}`)
      this.integrationAccount = await this.integrationAccountService.createOrUpdateOne({
        key: this.parentKey,
        name: this.parentName,
        description: '', // TODO
        authType: authDefinition.authType,
        fieldsSchema: authDefinition.schema,
      })
    }

    return this.integrationAccount
  }

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    opts.inputs.Region = opts.credentials.region
    return opts
  }

  requestInterceptor(options: RequestInterceptorOptions): request.OptionsWithUrl {
    const { req, schema, action, credentials } = options

    const reqOptions: any = {
      path: action.schemaPath?.split('#')[0],
      method: action.schemaMethod?.toUpperCase(),
      service: schema['x-metadata']?.endpointPrefix,
      region: credentials.region,
      headers: req.headers,
      body: req.body,
    }

    switch (schema['x-metadata']?.protocol) {
      case 'json':
      case 'rest-json':
      case 'rest-xml':
        reqOptions.headers['Content-Type'] = `application/x-amz-json-${schema['x-metadata']?.jsonVersion ?? '1.0'}`
        break
      case 'query':
        const awsAction = action.schemaPath?.split('Action=')?.[1]
        reqOptions.headers['X-Amz-Target'] = `${schema['x-metadata']?.targetPrefix}.${awsAction}`
        reqOptions.headers['Content-Encoding'] = 'amz-1.0'
        reqOptions.headers['Content-Type'] = 'application/json'
        break
    }

    aws4.sign(reqOptions, credentials)
    req.headers = reqOptions.headers
    return req
  }

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    const summary = (operationSchema.summary ?? operationSchema.operationId ?? '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^GET_/, '')
      .replace(/^POST_/, '')
      .replace(/^PUT_/, '')
      .replace(/^DELETE_/, '')
      .replace(/\d{4}_\d{2}_\d{2}$/, '') // i.e. UpdateDistribution2018_06_18
      .trim()

    if (!summary) {
      throw new Error(`Cannot set name for operation ${JSON.stringify(operationSchema)}`)
    }

    return {
      ...operationSchema,
      summary,
    }
  }

  getTriggerIdField(schema: JSONSchema7, parentProperty: string, operationObject: OperationObject): string | null {
    const keys: string[] = schema.required ?? Object.keys(schema.properties ?? {})

    // Try to find the id field using the parent name
    const singularParent = pluralize.singular(parentProperty)
    const idKeys = ['id', 'arn'].map((id) => `${singularParent.toLowerCase()}${id}`)
    const idField = keys.find((field) => idKeys.includes(field.toLowerCase())) ?? null
    if (idField) {
      return idField
    }

    // Try to find the id field using the operation name
    const operationName = operationObject?.summary?.toLowerCase().replace('describe', '').replace('list', '').trim()
    const operationIdKeys = ['id', 'arn'].map((id) => `${pluralize.singular(operationName)}${id}`)
    const operationIdField = keys.find((field) => operationIdKeys.includes(field.toLowerCase())) ?? null
    if (operationIdField) {
      return operationIdField
    }

    // Select fields ending in id or arn
    const idArn =
      keys.find((field) => field.toLowerCase().endsWith('id') ?? field.toLowerCase().endsWith('arn')) ?? null
    if (idArn) {
      return idArn
    }

    // Select the name field
    const nameField = keys.find((field) => field.toLowerCase() === 'name')
    if (nameField) {
      return nameField
    }

    // Select fields ending in name
    return keys.find((field) => field.toLowerCase().endsWith('name')) ?? null
  }

  async getIntegrationsData(): Promise<SingleIntegrationData[]> {
    const integrations: SingleIntegrationData[] = []

    this.logger.debug('Fetching api definitions')
    const apiDefinitionFiles = await getApiDefinitionFiles()
    const normalAPIDefinitions = apiDefinitionFiles.filter((file) => file.includes('.normal'))

    this.logger.log(`Found AWS API definitions for ${normalAPIDefinitions.length} integrations`)

    for (const apiPath of normalAPIDefinitions) {
      const endpointIndex = apiPath.match(/-\d{4}-\d{2}-\d{2}/)?.index
      const endpoint = apiPath.substr(0, endpointIndex)

      const normalApiDefinitionUrl = `https://raw.githubusercontent.com/aws/aws-sdk-js/master/apis/${apiPath}`
      this.logger.debug(`[GET] ${normalApiDefinitionUrl}`)
      const definitionRes = await new HttpService().request({ url: normalApiDefinitionUrl }).toPromise()
      const definition: NormalAPIDefinition = definitionRes.data

      let integrationKey = definition.metadata.endpointPrefix.replace(/\./g, '-')

      // Key must start with aws, amazon or alexa
      if (
        !integrationKey.startsWith('aws') &&
        !integrationKey.startsWith('amazon') &&
        !integrationKey.startsWith('alexa')
      ) {
        integrationKey = 'aws-' + integrationKey
      }

      if (this.integrationKeyMap[integrationKey]) {
        integrationKey = this.integrationKeyMap[integrationKey]
      }
      const integrationVersion = definition.metadata.apiVersion
      const schemaUrl = `https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/amazonaws.com/${endpoint}/${integrationVersion}/openapi.yaml`

      if (!this.skipKeys.includes(integrationKey)) {
        integrations.push({
          integrationKey,
          integrationVersion,
          schemaUrl,
          deprecated: true,
          metadata: definition.metadata,
        })
      }
    }

    return integrations.map((integration) => ({
      ...integration,
      deprecated: !!integrations.find(
        (s) => s.integrationKey === integration.integrationKey && s.integrationVersion > integration.integrationVersion,
      ),
    }))
  }

  async updateSchemaBeforeSave(schema: OpenAPIObject, integrationData: SingleIntegrationData): Promise<OpenAPIObject> {
    // Ensure all services have targetPrefix (protocol json have it in normal def, the rest we need to fetch from model)
    if (!schema.info['x-deprecated'] && !schema['x-metadata']?.targetPrefix) {
      const serviceId = schema['x-metadata'].serviceId.toLowerCase().replace(/\s/g, '-')
      const key = `${serviceId}.${schema['x-metadata'].apiVersion}`
      const url = `https://raw.githubusercontent.com/aws/aws-sdk-js-v3/master/codegen/sdk-codegen/aws-models/${key}.json`
      this.logger.log(`Fetching targetPrefix from ${url}`)
      const res = (await new HttpService().request({ url }).toPromise()).data
      const serviceShape = Object.entries(res.shapes).find((shape: any) => shape[1].type === 'service')
      if (!serviceShape || !serviceShape?.[0].includes('#')) {
        throw new Error(`Failed to find targetPrefix for ${key}`)
      }
      schema['x-metadata'].targetPrefix = serviceShape[0].split('#')[1]
    }

    // Remove duplicated operations. Some AWS services like CloudWatch has the same operation defined with GET and POST
    // Duplicated operations have same summary but different method.
    for (const [pathKey, pathValue] of Object.entries(schema.paths)) {
      const operations = Object.entries(pathValue)
        .filter((x: [string, OperationObject]) => x[1].summary ?? x[1].description)
        .sort((a) => (a[0] === 'post' ? -1 : 1)) as Array<[string, OperationObject]>
      const summarySet = new Set()
      for (const [method, operation] of operations) {
        if (summarySet.has(operation.summary)) {
          delete schema.paths[pathKey][method]
        }
        summarySet.add(operation.summary)
      }
    }

    // Remove "X-Amz" headers
    for (const [paramKey, paramValue] of Object.entries(schema.components?.parameters ?? {})) {
      if (paramKey.startsWith('X-Amz-')) {
        paramValue['x-ignore'] = true
      }
    }

    return schema
  }

  async onHookReceived(req: Request): Promise<boolean> {
    if (req.body.Type === 'SubscriptionConfirmation' && req.body.SubscribeURL) {
      this.logger.log(`Confirmed subscription for hook ${req.params.hookId}`)
      await new HttpService().request(req.body.SubscribeURL).toPromise()
      return false
    }
    return true
  }
}

async function getApiDefinitionFiles(): Promise<string[]> {
  const httpService = new HttpService()
  const res = await httpService
    .request({ url: 'https://api.github.com/repos/aws/aws-sdk-js/git/trees/master' })
    .toPromise()
  const apisNode = res.data.tree.find((node: any) => node.path === 'apis')
  const nodeDataRes = await httpService.request({ url: apisNode.url }).toPromise()
  return nodeDataRes.data.tree.map((node: any) => node.path)
}
