import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OpenAPIObject } from 'openapi3-ts'
import { Observable } from 'rxjs'
import { RunOutputs, RunResponse } from '../definition'
import {
  getPipedreamOperations,
  PipedreamOperation,
  runPipedreamOperation,
  updatePipedreamSchemaBeforeInstall,
  updatePipedreamSchemaBeforeSave,
} from '../utils/pipedream.utils'

export class RedditDefinition extends SingleIntegrationDefinition {
  integrationKey = 'reddit'
  integrationVersion = '1'
  schemaUrl = null
  operations: PipedreamOperation[]

  async createOrUpdateIntegrationAccount(schema: OpenAPIObject): Promise<IntegrationAccount | null> {
    const integrationAccount = await super.createOrUpdateIntegrationAccount(schema)
    if (!integrationAccount) {
      return null
    }
    return await this.integrationAccountService.createOrUpdateOne({
      key: integrationAccount.key,
      authParams: {
        duration: 'permanent',
      },
      customStrategyKey: 'reddit',
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

  // TODO this cannot be abstracted now, because of how webpack manages dynamic imports
  // webpack will pre-import every file in the directories that might be imported
  // if components/${key} is used, then webpack will try to import everything under the components folder
  // the components have a lot of service specific dependencies that we would have to install to support it
  private async getOperations(): Promise<PipedreamOperation[]> {
    if (!this.operations) {
      this.operations = await getPipedreamOperations('reddit', this.getOperation)
    }
    return this.operations
  }

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/reddit/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
