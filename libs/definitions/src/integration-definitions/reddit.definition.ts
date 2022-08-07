import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import fs from 'fs'
import { OpenAPIObject } from 'openapi3-ts'
import path from 'path'
import { RunResponse } from '../definition'
import {
  PipedreamAction,
  runPipedreamAction,
  updatePipedreamSchemaBeforeInstall,
  updatePipedreamSchemaBeforeSave,
} from '../utils/pipedream.utils'

export class RedditDefinition extends SingleIntegrationDefinition {
  integrationKey = 'reddit'
  integrationVersion = '1'
  schemaUrl = null

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
    return updatePipedreamSchemaBeforeSave(schema, actions)
  }

  async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const actions = await this.getActions()
    return updatePipedreamSchemaBeforeInstall(schema, actions)
  }

  async run(opts: OperationRunOptions): Promise<RunResponse> {
    const actions = await this.getActions()
    const action = actions.find((a) => a.key === opts.operation.key)
    if (!action) {
      throw new Error(`Action ${opts.operation.key} not found for integration ${opts.integration.key}`)
    }
    return runPipedreamAction(action, opts)
  }

  // TODO this cannot be abstracted now, because of how webpack manages dynamic imports
  // webpack will pre-import every file in the directories that might be imported
  // if components/${key} is used, then webpack will try to import everything under the components folder
  // the components have a lot of service specific dependencies that we would have to install to support it
  private async getActions(): Promise<PipedreamAction[]> {
    const integrationRootPath = 'dist/pipedream/components/reddit'
    const actionsPath = path.join(integrationRootPath, 'actions')
    const actionKeys = await fs.promises.readdir(actionsPath)
    const actions: any[] = []
    for (const actionKey of actionKeys) {
      const { default: action } = await import(
        `../../../../dist/pipedream/components/reddit/actions/${actionKey}/${actionKey}.mjs`
      )
      actions.push(action)
    }
    return actions
  }
}
