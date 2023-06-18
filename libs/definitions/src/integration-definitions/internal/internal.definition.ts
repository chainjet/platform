import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { RunInternalCodeAction } from './actions/run-internal-code.action'

export class InternalDefinition extends SingleIntegrationDefinition {
  integrationKey = 'internal'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new RunInternalCodeAction()]
}
