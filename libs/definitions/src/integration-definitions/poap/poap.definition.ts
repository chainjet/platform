import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { GetPoapEventAction } from './actions/get-poap-event.action'
import { GetPoapTokenAction } from './actions/get-poap-token.action'
import { NewPoapCollected } from './triggers/new-poap-collected.trigger'
import { NewPoapHolder } from './triggers/new-poap-holder.trigger'

export class PoapDefinition extends SingleIntegrationDefinition {
  integrationKey = 'poap'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewPoapCollected(), new NewPoapHolder()]
  actions = [new GetPoapEventAction(), new GetPoapTokenAction()]
}
