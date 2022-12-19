import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class DiscourseDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'discourse'
  pipedreamKey = 'discourse'
  integrationVersion = '1'
  schemaUrl = null

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/discourse/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
