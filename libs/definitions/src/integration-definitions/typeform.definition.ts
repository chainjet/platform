import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class TypeFormDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'typeform'
  pipedreamKey = 'typeform'
  integrationVersion = '1'
  schemaUrl = null

  async getExternalOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/typeform/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
