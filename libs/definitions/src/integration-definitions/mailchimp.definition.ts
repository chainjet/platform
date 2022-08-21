import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OpenAPIObject } from 'openapi3-ts'
import { Observable } from 'rxjs'
import { RunResponse } from '../definition'
import {
  getAsyncSchemasForPipedream,
  getPipedreamOperations,
  PipedreamOperation,
  runPipedreamOperation,
  updatePipedreamSchemaBeforeInstall,
  updatePipedreamSchemaBeforeSave,
} from '../utils/pipedream.utils'

export class MailchimpDefinition extends SingleIntegrationDefinition {
  integrationKey = 'mailchimp'
  integrationVersion = '1'
  schemaUrl = null
  operations: PipedreamOperation[]

  async createOrUpdateIntegrationAccount(schema: OpenAPIObject): Promise<IntegrationAccount | null> {
    const integrationAccount = await super.createOrUpdateIntegrationAccount(schema)
    if (!integrationAccount) {
      return null
    }
    // mailchimp needs custom auth because we need to fetch the data center for the account
    return await this.integrationAccountService.updateOne(integrationAccount.id, {
      customStrategyKey: 'mailchimp',
    })
  }

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const operations = await this.getOperations()
    return updatePipedreamSchemaBeforeSave(schema, operations)
  }

  async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const operations = await this.getOperations()
    return updatePipedreamSchemaBeforeInstall(schema, operations)
  }

  async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse>> {
    const operations = await this.getOperations()
    const operation = operations.find((a) => a.key === opts.operation.key)
    if (!operation) {
      throw new Error(`Operation ${opts.operation.key} not found for integration ${opts.integration.key}`)
    }
    return runPipedreamOperation(operation, opts)
  }

  async getAsyncSchemas(operation: IntegrationAction | IntegrationTrigger) {
    return getAsyncSchemasForPipedream(await this.getOperations(), operation)
  }

  private async getOperations(): Promise<PipedreamOperation[]> {
    if (!this.operations) {
      this.operations = await getPipedreamOperations('mailchimp', this.getOperation)
    }
    return this.operations
  }

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/mailchimp/${type}/${key}/${key}.mjs`)
    return op.default
  }

  parseError(e: any) {
    const errorData = e?.response?.data
    if (errorData?.detail ?? errorData?.errors?.length) {
      return (errorData.detail ?? '') + ' ' + errorData.errors?.map((e) => e.message).join(',')
    }
    return super.parseError(e)
  }
}
