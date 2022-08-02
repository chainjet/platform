import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { StepInputs } from '..'
import { IntegrationAccount } from '../../../../apps/api/src/integration-accounts/entities/integration-account'
import { Integration } from '../../../../apps/api/src/integrations/entities/integration'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

interface MediumProfile {
  id: string
  username: string
  name: string
  url: string
  imageUrl: string
}

export class MediumDefinition extends SingleIntegrationDefinition {
  integrationKey = 'medium'
  integrationVersion = '1'
  schemaUrl =
    'https://raw.githubusercontent.com/amardeshbd/medium-api-specification/master/medium-api-specification.yaml'

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    // Medium asks for user / author IDs on the path, we hidded those fields and fetch the values directly
    // TODO this could be stored in a profile field on the account credential
    const properties = opts.operation.schemaRequest.properties
    if ((properties?.userId && !opts.inputs.userId) || (properties?.authorId && !opts.inputs.authorId)) {
      const profile = await this.getProfile(opts.integration, opts.integrationAccount, opts.credentials)
      if (profile) {
        if (properties?.userId) {
          opts.inputs.userId = profile.id
        } else {
          opts.inputs.authorId = profile.id
        }
      }
    }

    return opts
  }

  // TODO
  // https://github.com/Medium/medium-api-docs#31-users
  async getProfile(
    integration: Integration,
    integrationAccount: IntegrationAccount | null,
    credentials: StepInputs,
  ): Promise<MediumProfile | null> {
    const integrationAction = await this.integrationActionService.findOne({
      integration: integration.id,
      key: '/me.get',
    })
    if (integrationAction) {
      // const body = await this.run(integration, integrationAccount, integrationAction, {}, credentials)
      // return body.data as MediumProfile
    }
    return null
  }
}
