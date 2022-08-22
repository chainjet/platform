import { isEmptyObj } from '@app/common/utils/object.utils'
import { SecurityUtils } from '@app/common/utils/security.utils'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import deepmerge from 'deepmerge'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import fs from 'fs'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject, OperationObject, ParameterObject, ReferenceObject, SchemaObject } from 'openapi3-ts'
import path from 'path'
import {
  Action,
  AppPropDefinitions,
  DataStoreProp,
  EmitMetadata,
  HttpRequestProp,
  InterfaceProp,
  JSONValue,
  Methods,
  PropDefinition,
  ServiceDBProp,
  Source,
  SourcePropDefinitions,
  UserProp,
} from 'pipedream/types/src'
import { ParsedQs } from 'qs'
import { Observable } from 'rxjs'
import { GetAsyncSchemasProps, RunResponse, SingleIntegrationData } from '../definition'
import { parseJsonSchemaValue } from '../schema/utils/jsonSchemaUtils'
import { AsyncSchema } from '../types/AsyncSchema'

type PipedreamAction = Action<Methods, AppPropDefinitions>
type PipedreamSource = Source<Methods, SourcePropDefinitions>
type PipedreamOperation = PipedreamAction | PipedreamSource

type PropType =
  | UserProp['type']
  | InterfaceProp['type']
  | ServiceDBProp['type']
  | DataStoreProp['type']
  | HttpRequestProp['type']

type OperationGetter = (type: string, key: string) => Promise<PipedreamOperation>

type AbstractConstructor<T> = abstract new (...args: any[]) => T

export function PipedreamMixin<T extends AbstractConstructor<SingleIntegrationData>>(Base: T) {
  abstract class _PipedreamMixin extends Base {
    abstract pipedreamKey: string
    operations: PipedreamOperation[]

    abstract getOperation(type: string, key: string): Promise<PipedreamOperation>

    async afterCreateWorkflowTrigger(
      workflowTrigger: WorkflowTrigger,
      integrationTrigger: IntegrationTrigger,
      accountCredential: AccountCredential | null,
      update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
    ) {
      await runPipedreamAfterCreateWorkflowTrigger(
        await this.getOperations(),
        workflowTrigger,
        integrationTrigger,
        accountCredential,
        update,
      )
    }

    async afterUpdateWorkflowTrigger(
      workflowTrigger: WorkflowTrigger,
      integrationTrigger: IntegrationTrigger,
      accountCredential: AccountCredential | null,
      update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
    ) {
      await runPipedreamAfterUpdateWorkflowTrigger(
        await this.getOperations(),
        workflowTrigger,
        integrationTrigger,
        accountCredential,
        update,
      )
    }

    async afterDeleteWorkflowTrigger(
      workflowTrigger: WorkflowTrigger,
      integrationTrigger: IntegrationTrigger,
      accountCredential: AccountCredential | null,
    ) {
      await runPipedreamAfterDeleteWorkflowTrigger(
        await this.getOperations(),
        workflowTrigger,
        integrationTrigger,
        accountCredential,
      )
    }

    async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
      const operations = await this.getOperations()
      return updatePipedreamSchemaBeforeSave(schema, operations)
    }

    async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
      const operations = await this.getOperations()
      return updatePipedreamSchemaBeforeInstall(schema, operations)
    }

    async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> {
      const operations = await this.getOperations()
      const operation = operations.find((a) => a.key === opts.operation.key)
      if (operation) {
        return runPipedreamOperation(operation, opts)
      }
      return null
    }

    // TODO
    async onHookReceivedForWorkflowTrigger(
      req: Request<ParamsDictionary, any, any, ParsedQs>,
      opts: OperationRunOptions,
    ): Promise<boolean> {
      const operations = await this.getOperations()
      const operation = operations.find((a) => a.key === opts.operation.key)
      if (operation) {
        console.log(`Workflow received for operation:`, operation.key)
        await runPipedreamOperation(operation, opts)
      }
      return false
    }

    async getAsyncSchemas(operation: IntegrationAction | IntegrationTrigger) {
      return getAsyncSchemasForPipedream(await this.getOperations(), operation)
    }

    async getOperations(): Promise<PipedreamOperation[]> {
      if (!this.operations) {
        this.operations = await getPipedreamOperations(this.pipedreamKey, this.getOperation)
      }
      return this.operations
    }
  }

  return _PipedreamMixin
}

function mapPipedreamTypeToOpenApi(type: PropType): SchemaObject {
  if (type.endsWith('[]')) {
    return { type: 'array', items: mapPipedreamTypeToOpenApi(type.slice(0, -2) as UserProp['type']) }
  }
  switch (type) {
    case 'string':
      return {
        type: 'string',
      }
    case 'boolean':
      return {
        type: 'boolean',
      }
    case 'integer':
      return {
        type: 'integer',
      }
    case 'object':
      return {
        type: 'object',
        additionalProperties: true,
        properties: {},
      }
    default:
      return {
        type: 'string',
      }
  }
}

function mapPipedreamOperationToOpenApi(operation: PipedreamOperation): {
  operation: OperationObject
  asyncSchemas: AsyncSchema[]
} {
  const asyncSchemas: AsyncSchema[] = []
  const parameters: (ParameterObject | ReferenceObject)[] = Object.entries(operation.props ?? {})
    .map(([key, value]) => {
      if (typeof value !== 'object') {
        return null
      }

      let propDefinition: PropDefinition | null = null
      if ('propDefinition' in value) {
        propDefinition = value.propDefinition
        if (value.propDefinition.length >= 2) {
          value = {
            ...value.propDefinition[0].propDefinitions![value.propDefinition[1]],
            ...value,
          }
        }
      }

      if (!('type' in value)) {
        throw new Error(`property without a type on key ${key}`)
      }

      if (value.type === 'app' || value.type.startsWith('$') || value.type === 'http_request') {
        return null
      }

      const param: ParameterObject = {
        name: key,
        in: 'query',
        required: !(value as { optional: boolean }).optional,
      }
      const schema: SchemaObject = mapPipedreamTypeToOpenApi(value.type)

      if ('label' in value && value.label) {
        schema.title = value.label
      }

      if ('description' in value && value.description) {
        param.description = value.description
      }

      if ('default' in value && value.default) {
        schema.default = value.default
      }

      if ('secret' in value && value.secret) {
        // TODO https://trello.com/c/11fTX1dC/6-encrypted-secret-params
      }

      if ('min' in value && value.min) {
        schema.minimum = value.min
      }
      if ('max' in value && value.max) {
        schema.maximum = value.max
      }

      if ('options' in value && value.options) {
        if (Array.isArray(value.options)) {
          // if the options are all strings, we can use enum, otherwise we need to use oneOf
          if (value.options.every((option) => typeof option === 'string')) {
            schema.enum = value.options
          } else {
            schema.oneOf = value.options.map((option) => ({
              title: option.label,
              'x-const': option.value,
            }))
          }
        } else if (typeof value.options === 'function') {
          // The third argument of propDefinition has the dependencies of the async schema
          if (propDefinition?.length === 3) {
            const dependencyObj = propDefinition[2]({})
            asyncSchemas.push({
              name: key,
              dependencies: Object.keys(dependencyObj),
            })
          } else {
            asyncSchemas.push({
              name: key,
            })
          }
        } else {
          throw new Error(`Unknown options value for ${key}`)
        }
      }

      return {
        ...param,
        schema,
      }
    })
    .filter((param) => param !== null) as (ParameterObject | ReferenceObject)[]

  return {
    operation: {
      summary: operation.name,
      description: operation.description,
      parameters,
      responses: {},
    },
    asyncSchemas,
  }
}

async function updatePipedreamSchemaBeforeSave(
  schema: OpenAPIObject,
  operations: PipedreamOperation[],
): Promise<OpenAPIObject> {
  schema.paths = schema.paths ?? {}
  for (const operation of operations) {
    schema.paths['/' + operation.key] = schema.paths['/' + operation.key] ?? {
      get: {
        operationId: operation.key,

        // Components without a type are considered sources
        [operation.type === 'action' ? 'x-actionOnly' : 'x-triggerOnly']: true,

        'x-learnResponseWorkflow': true,
        summary: '',
        responses: {
          '200': {
            description: '',
            content: {
              'application/json': {
                schema: {},
              },
            },
          },
        },
      },
    }
  }
  return schema
}

async function updatePipedreamSchemaBeforeInstall(
  schema: OpenAPIObject,
  operations: PipedreamOperation[],
): Promise<OpenAPIObject> {
  for (const operation of operations) {
    const actionKey = '/' + operation.key
    const schemaOperation = schema.paths[actionKey].get
    if (schemaOperation.summary === '') {
      delete schemaOperation.summary
    }

    const operationData = mapPipedreamOperationToOpenApi(operation)
    const schemaParams = schemaOperation.parameters ?? []

    // parameters are merged by name to avoid duplicates
    const mergedParams = (operationData.operation.parameters ?? []).reduce((prev, curr, i) => {
      const schemaParam = 'name' in curr && schemaParams.find((param) => param?.name === curr.name)
      if (schemaParam) {
        return [...prev.slice(0, i), deepmerge(curr, schemaParam), ...prev.slice(i + 1)]
      }
      return [...prev, curr]
    }, [])
    for (const param of schemaParams) {
      if (!mergedParams.find((p) => (p as any)?.name === param.name)) {
        mergedParams.push(param)
      }
    }

    operationData.operation['x-triggerIdKey'] = 'items[].id'

    if (operation.name?.toLowerCase().includes('(instant)')) {
      operationData.operation['x-triggerInstant'] = true
      operationData.operation.summary = operationData.operation.summary?.replace(/\(instant\)/i, '').trim()
    }

    // update trigger descriptions
    const descriptionReplacements = {
      'Emit new event each time': 'Triggers when',
      'Emits a new event any time': 'Triggers when',
      'Emit new event for': 'Triggers for',
      'Emit new event when': 'Triggers when',
      'Emit new event on each': 'Triggers on each',
    }
    for (const [key, value] of Object.entries(descriptionReplacements)) {
      operationData.operation.description = operationData.operation.description?.replace(key, value)
    }

    schema.paths[actionKey].get = deepmerge(operationData.operation, schemaOperation)
    schema.paths[actionKey].get.parameters = mergedParams

    if (operationData.asyncSchemas.length) {
      schema.paths[actionKey].get['x-asyncSchemas'] = schema.paths[actionKey].get['x-asyncSchemas'] ?? []
      schema.paths[actionKey].get['x-asyncSchemas'].push(...operationData.asyncSchemas)
    }
  }
  return schema
}

function getBindData(
  operation: PipedreamOperation,
  opts: {
    operation: IntegrationAction | IntegrationTrigger
    workflowOperation?: WorkflowAction | WorkflowTrigger
    inputs: Record<string, any>
    credentials: Record<string, any>
    accountCredential: AccountCredential | null
  },
  req?: any, // TODO
): { bindData: Record<string, any>; hookId?: string } {
  const propEntries = Object.entries(operation.props ?? {})
  const appData = propEntries.find(([_, prop]) => typeof prop === 'object' && 'type' in prop && prop.type === 'app')
  if (!appData) {
    throw new Error(
      `Action ${opts.operation.key} is not configured correctly for integration ${opts.operation.integration.id}`,
    )
  }

  const $auth = {
    oauth_access_token: opts.credentials.accessToken,
    oauth_refresh_token: opts.credentials.refreshToken,
    ...opts.credentials,
  }

  const [appKey, app] = appData
  const appMethods = 'methods' in app ? { ...app.methods, $auth } : {}

  if ('_getHeaders' in appMethods) {
    const headers = (appMethods as Methods)._getHeaders() as object
    const userAgentKey = Object.keys(headers).find((key) => key.toLowerCase() === 'user-agent')
    if (userAgentKey) {
      delete headers[userAgentKey]
    }
    ;(appMethods as Methods)._getHeaders = function () {
      return {
        ...headers,
        [userAgentKey ?? 'User-Agent']: 'ChainJet.io - admin@chainjet.io',
      }
    }.bind(appMethods)
  }

  const httpProp = propEntries.find(
    ([_, prop]) => typeof prop === 'object' && 'type' in prop && prop.type === '$.interface.http',
  )
  const httpInterface = {}
  let hookId: string | undefined
  if (httpProp) {
    hookId =
      opts.workflowOperation && 'hookId' in opts.workflowOperation
        ? opts.workflowOperation.hookId
        : SecurityUtils.generateRandomString(48)
    httpInterface[httpProp[0]] = {
      // endpoint: `${process.env.API_ENDPOINT}/hooks/${hookId}`, // TODO
      endpoint: `https://8900-141-8-27-111.eu.ngrok.io/hooks/${hookId}`,
      respond: (...args) => {
        console.log(`== RESPOND ==`, ...args) // TODO
      },
    }
  }

  return {
    bindData: {
      ...appMethods,
      ...opts.inputs,
      [appKey]: appMethods, // include methods defined at app level
      ...operation.methods, // include methods defined at operation level
      ...httpInterface,
      ...opts.accountCredential,
    },
    hookId,
  }
}

async function runPipedreamOperation(
  operation: PipedreamOperation,
  opts: OperationRunOptions,
): Promise<RunResponse | Observable<RunResponse>> {
  const { bindData } = getBindData(operation, opts)

  if (operation.type === 'action') {
    for (const key of Object.keys(operation.methods ?? {})) {
      operation.methods![key] = operation.methods![key].bind(bindData)
      bindData[key] = operation.methods![key]
    }

    // TODO handle exports
    const $ = {
      export: (key: string, value: string) => {
        // console.log(`Export =>`, key, value)
      },
    }

    const outputs = await operation.run.bind(bindData)({ $ })
    return {
      outputs,
    }
  } else {
    return new Observable((subscriber) => {
      // use a temporary store instead of writing directly on the workflow operation, because we don't want to save it in case of failure
      const tempStore = {
        ...(opts.workflowOperation?.store ?? {}),
      }

      const $emit: (event: JSONValue, metadata: EmitMetadata) => Promise<void> = async (
        event: JSONValue,
        metadata: EmitMetadata,
      ) => {
        if (!event) {
          return
        }
        if (typeof event !== 'object') {
          throw new Error(`Non object events not supported yet`)
        }
        if (Array.isArray(event)) {
          throw new Error(`Array events not supported yet`)
        }
        if (!metadata.id) {
          throw new Error(`Events without id not supported yet`)
        }
        subscriber.next({
          outputs: {
            id: metadata.id.toString(),
            ...event,
          },
          store: tempStore,
        })
      }
      bindData['$emit'] = $emit

      // use the store in the workflowOperation as db
      bindData.db = {
        get: (key: string) => tempStore[key],
        set: (key: string, value: any) => {
          tempStore[key] = value
        },
      }

      for (const key of Object.keys(operation.methods ?? {})) {
        operation.methods![key] = operation.methods![key].bind(bindData)
        bindData[key] = operation.methods![key]
      }

      const event = {
        timestamp: new Date(),
      }

      operation.run
        .bind(bindData)(event)
        .then(() => {
          subscriber.complete()
        })
        .catch((e: Error) => {
          subscriber.error(e)
        })
    })
  }
}

async function getPipedreamOperationKeys(componentKey: string): Promise<{ key: string; type: string }[]> {
  const componentRootPath = `dist/pipedream/components/${componentKey}`
  const actionsPath = path.join(componentRootPath, 'actions')
  const actionKeys = (await fs.promises.readdir(actionsPath)).filter((key) => !key.includes('.'))
  const sourcesPath = path.join(componentRootPath, 'sources')
  const sourceKeys = (await fs.promises.readdir(sourcesPath)).filter((key) => !key.includes('.'))
  const operationKeys = [
    ...actionKeys.map((key) => ({ key, type: 'actions' })),
    ...sourceKeys.map((key) => ({ key, type: 'sources' })),
  ]

  // check if files for all the keys exist
  const nonExistentKeys: string[] = []
  for (const { key, type } of operationKeys) {
    const filePath = path.join(type === 'actions' ? actionsPath : sourcesPath, key, key + '.mjs')
    try {
      await fs.promises.access(filePath, fs.constants.R_OK | fs.constants.W_OK)
    } catch {
      nonExistentKeys.push(key)
    }
  }

  return operationKeys.filter(({ key }) => !nonExistentKeys.includes(key))
}

async function getPipedreamOperations(
  integrationKey: string,
  opGetter: OperationGetter,
): Promise<PipedreamOperation[]> {
  const operationKeys = await getPipedreamOperationKeys(integrationKey)
  const operations: PipedreamOperation[] = []
  for (const { type, key } of operationKeys) {
    operations.push(await opGetter(type, key))
  }
  return operations
}

function getAsyncSchemasForPipedream(
  operations: PipedreamOperation[],
  integrationOperation: IntegrationAction | IntegrationTrigger,
) {
  const asyncSchemas: AsyncSchema[] = integrationOperation.schemaRequest?.['x-asyncSchemas']
  return asyncSchemas.reduce((acc, curr) => {
    acc[curr.name] = async (props: GetAsyncSchemasProps) => {
      // check all dependencies for the async schema have been provided
      const unmetDependencies = curr.dependencies?.some((dep) => !props.inputs[dep])
      if (curr.dependencies?.length && unmetDependencies) {
        return {}
      }

      const pipedreamOperation = operations.find((a) => a.key === props.operation.key)
      if (!pipedreamOperation) {
        throw new Error(`Operation ${props.operation.key} not found for integration ${props.integration.key}`)
      }
      let prop = pipedreamOperation.props![curr.name] ?? {}
      if ('propDefinition' in prop) {
        if (prop.propDefinition.length >= 2) {
          prop = {
            ...prop.propDefinition[0].propDefinitions![prop.propDefinition[1]],
            ...prop,
          }
        }
      }
      if ('options' in prop && typeof prop.options === 'function') {
        const { bindData } = getBindData(pipedreamOperation, props)
        let items = await prop.options.bind(bindData)({ page: 0, ...props.inputs })

        // items can be an array or an object where the options keys hold the items array
        if ('options' in items) {
          items = items.options
        }

        // make sure items is a non-empty array
        if (!Array.isArray(items) || !items.length) {
          return {}
        }

        const propSchema = integrationOperation.schemaRequest.properties?.[curr.name] ?? {}

        // if there is only one item, set it as default
        const asyncSchema: JSONSchema7 = {
          ...(items.length === 1 ? { default: parseJsonSchemaValue(propSchema, items[0].value) } : {}),
        }

        // items can be an array of strings or an array of { label: string, value: any }
        if (items.every((item) => typeof item === 'string')) {
          return {
            ...asyncSchema,
            enum: items,
          }
        }

        return {
          ...asyncSchema,
          oneOf: items.map((item) => ({
            title: item.label,
            const: parseJsonSchemaValue(propSchema, item.value),
          })),
        }
      }
      return {}
    }
    return acc
  }, {})
}

async function runPipedreamAfterCreateWorkflowTrigger(
  operations: PipedreamOperation[],
  workflowTrigger: WorkflowTrigger,
  integrationTrigger: IntegrationTrigger,
  accountCredential: AccountCredential | null,
  update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
) {
  const operation = operations.find(
    (operation) => operation.type === 'source' && operation.key === integrationTrigger.key,
  ) as PipedreamSource
  if (operation) {
    const { bindData, hookId } = getBindData(operation, {
      operation: integrationTrigger,
      workflowOperation: workflowTrigger,
      inputs: workflowTrigger.inputs ?? {},
      credentials: accountCredential?.credentials ?? {},
      accountCredential,
    })
    const tempStore = {}
    bindData.db = {
      get: (key: string) => tempStore[key],
      set: (key: string, value: any) => {
        tempStore[key] = value
      },
    }
    if (hookId) {
      await update({ hookId })
    }
    if (operation.hooks?.deploy) {
      await operation.hooks.deploy.bind(bindData)()
    }
    if (operation.hooks?.activate) {
      await operation.hooks.activate.bind(bindData)()
    }
    if (!isEmptyObj(tempStore)) {
      await update({ store: tempStore })
    }
  }
}

async function runPipedreamAfterUpdateWorkflowTrigger(
  operations: PipedreamOperation[],
  workflowTrigger: WorkflowTrigger,
  integrationTrigger: IntegrationTrigger,
  accountCredential: AccountCredential | null,
  update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
) {
  const operation = operations.find(
    (operation) => operation.type === 'source' && operation.key === integrationTrigger.key,
  ) as PipedreamSource
  if (operation && operation.hooks?.activate) {
    const { bindData } = getBindData(operation, {
      operation: integrationTrigger,
      workflowOperation: workflowTrigger,
      inputs: workflowTrigger.inputs ?? {},
      credentials: accountCredential?.credentials ?? {},
      accountCredential,
    })
    const tempStore = {
      ...(workflowTrigger?.store ?? {}),
    }
    bindData.db = {
      get: (key: string) => tempStore[key],
      set: (key: string, value: any) => {
        tempStore[key] = value
      },
    }
    await operation.hooks.activate.bind(bindData)()
    await update({ store: tempStore }) // TODO only if workflowTrigger.store != tempStore
  }
}

async function runPipedreamAfterDeleteWorkflowTrigger(
  operations: PipedreamOperation[],
  workflowTrigger: WorkflowTrigger,
  integrationTrigger: IntegrationTrigger,
  accountCredential: AccountCredential | null,
) {
  const operation = operations.find(
    (operation) => operation.type === 'source' && operation.key === integrationTrigger.key,
  ) as PipedreamSource
  if (operation && operation.hooks?.deactivate) {
    const { bindData } = getBindData(operation, {
      operation: integrationTrigger,
      workflowOperation: workflowTrigger,
      inputs: workflowTrigger.inputs ?? {},
      credentials: accountCredential?.credentials ?? {},
      accountCredential,
    })
    const tempStore = {
      ...(workflowTrigger?.store ?? {}),
    }
    bindData.db = {
      get: (key: string) => tempStore[key],
      set: (key: string, value: any) => {
        tempStore[key] = value
      },
    }
    await operation.hooks.deactivate.bind(bindData)()
  }
}
