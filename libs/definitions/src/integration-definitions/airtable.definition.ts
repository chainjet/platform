import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import request from 'request'
import { RequestInterceptorOptions, StepInputs } from '..'
import { AccountCredential } from '../../../../apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAccount } from '../../../../apps/api/src/integration-accounts/entities/integration-account'
import { Integration } from '../../../../apps/api/src/integrations/entities/integration'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'
import { generateSchemaFromObject } from '../schema/utils/jsonSchemaUtils'
import { IntegrationAuthDefinition, IntegrationAuthType } from '../typings/IntegrationAuthDefinition'

export class AirtableDefinition extends SingleIntegrationDefinition {
  integrationKey = 'airtable'
  integrationVersion = '1'
  schemaUrl = null

  protected integrationAccount: IntegrationAccount | undefined

  async createOrUpdateIntegrationAccount (): Promise<IntegrationAccount | null> {
    if (!this.integrationAccount) {
      const authDefinition: IntegrationAuthDefinition = {
        authType: IntegrationAuthType.http,
        schema: {
          type: 'object',
          required: ['apiKey', 'baseId'],
          exposed: ['baseId', 'tableName'],
          properties: {
            apiKey: {
              type: 'string',
              format: 'password',
              title: 'API Key',
              description: 'Go to https://airtable.com/account > Copy the API key, it should start with the word "key".'
            },
            baseId: {
              type: 'string',
              title: 'Base ID or Base API URL',
              description: 'Go to https://airtable.com/api > Select the base you would like to connect > Enter the URL here. It should start with "https://airtable.com/app".'
            },
            tableName: {
              type: 'string',
              title: 'Table Name',
              description: 'The name of the table you would like to connect. This is the name of the tab in your spreadsheet.'
            }
          }
        }
      }

      this.logger.debug('Creating or updating integration account for Airtable')
      this.integrationAccount = await this.integrationAccountService.createOrUpdateOne({
        key: this.integrationKey,
        name: 'Airtable',
        authType: authDefinition.authType,
        fieldsSchema: authDefinition.schema
      })
    }

    return this.integrationAccount
  }

  requestInterceptor (options: RequestInterceptorOptions): request.OptionsWithUrl {
    const { req, credentials } = options

    req.headers = req.headers ?? {}
    req.headers.Authorization = `Bearer ${credentials.apiKey}`

    if (req.body) {
      const data = JSON.parse(req.body)
      delete data.baseId
      delete data.tableName
      data.typecast = true
      req.body = JSON.stringify(data)
    }

    console.log('req.url =>', req.url)

    return req
  }

  async beforeOperationRun (opts: OperationRunOptions): Promise<OperationRunOptions> {
    opts.inputs.tableName = opts.credentials.tableName

    // baseId accepts the ID or the URL
    opts.inputs.baseId = opts.credentials.baseId
    if (opts.inputs.baseId?.includes('://')) {
      opts.inputs.baseId = opts.inputs.baseId.split('.com/')[1].split('/')[0]
    }

    return opts
  }

  async getInitOperationOptions (opts: {
    integration: Integration
    integrationAccount: IntegrationAccount | null
    credentials: StepInputs
    accountCredential: AccountCredential | null
  }): Promise<OperationRunOptions | null> {
    const { integration } = opts
    const integrationAction = await this.integrationActionService
      .findOne({ integration: integration._id, key: 'listRecords' })
    if (!integrationAction) {
      return null
    }
    return {
      ...opts,
      operation: integrationAction,
      inputs: {}
    }
  }

  async afterInitOperationRun (
    outputs: Record<string, unknown>,
    opts: OperationRunOptions
  ): Promise<{ accountCredential?: AccountCredential }> {
    const firstRecord = (outputs.records ?? [] as any)?.[0]
    if (opts.accountCredential && firstRecord?.fields) {
      const schema = generateSchemaFromObject(firstRecord?.fields)
      opts.accountCredential.schemaRefs = {
        ...(opts.accountCredential.schemaRefs ?? {}),
        record: schema
      }
      return {
        accountCredential: opts.accountCredential
      }
    }
    return {}
  }

  // async onWorkflowActionCreated (
  //   workflowAction: WorkflowAction,
  //   integrationAction: IntegrationAction,
  //   accountCredential?: AccountCredential
  // ): Promise<WorkflowAction> {
  //   if (!accountCredential?.schemaRefs?.field) {
  //     return workflowAction
  //   }
  //   switch (integrationAction.key) {
  //     case 'listRecords':
  //       workflowAction.schemaResponse = {
  //         type: 'object'

  //       }
  //       break
  //   }
  //   return workflowAction
  // }
}
