import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { PipedreamMixin } from '../../mixins/pipedream.mixin'

export class TwitterDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'twitter'
  pipedreamKey = 'twitter'
  integrationVersion = '1'
  schemaUrl = null

  actions = []

  async getExternalOperation(type: string, key: string) {
    const op = await import(`../../../../../dist/pipedream/components/twitter/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
