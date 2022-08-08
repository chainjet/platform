import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import fs from 'fs'
import { OpenAPIObject } from 'openapi3-ts'
import path from 'path'
import { Observable } from 'rxjs'
import { RunOutputs, RunResponse } from '../definition'
import {
  PipedreamAction,
  PipedreamSource,
  runPipedreamOperation,
  updatePipedreamSchemaBeforeInstall,
  updatePipedreamSchemaBeforeSave,
} from '../utils/pipedream.utils'

export class RedditDefinition extends SingleIntegrationDefinition {
  integrationKey = 'reddit'
  integrationVersion = '1'
  schemaUrl = null
  actions: PipedreamAction[]
  sources: PipedreamSource[]

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
    const actions = await this.getActions()
    const sources = await this.getSources()
    return updatePipedreamSchemaBeforeSave(schema, actions, sources)
  }

  async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const actions = await this.getActions()
    const sources = await this.getSources()
    return updatePipedreamSchemaBeforeInstall(schema, actions, sources)
  }

  async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunOutputs>> {
    const actions = await this.getActions()
    const sources = await this.getSources()
    const operations = [...actions, ...sources]
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
  private async getActions(): Promise<PipedreamAction[]> {
    if (!this.actions) {
      const integrationRootPath = 'dist/pipedream/components/reddit'
      const actionsPath = path.join(integrationRootPath, 'actions')
      const actionKeys = await fs.promises.readdir(actionsPath)
      this.actions = []
      for (const actionKey of actionKeys) {
        const { default: action } = await import(
          `../../../../dist/pipedream/components/reddit/actions/${actionKey}/${actionKey}.mjs`
        )
        this.actions.push(action)
      }
    }
    return this.actions
  }

  private async getSources(): Promise<PipedreamSource[]> {
    if (!this.sources) {
      const integrationRootPath = 'dist/pipedream/components/reddit'
      const sourcesPath = path.join(integrationRootPath, 'sources')
      const sourceKeys = (await fs.promises.readdir(sourcesPath)).filter((key) => !key.includes('.'))
      this.sources = []
      for (const sourceKey of sourceKeys) {
        const { default: action } = await import(
          `../../../../dist/pipedream/components/reddit/sources/${sourceKey}/${sourceKey}.mjs`
        )
        this.sources.push(action)
      }
    }
    return this.sources
  }
}
