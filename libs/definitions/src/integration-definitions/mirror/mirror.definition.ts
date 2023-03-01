import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { NewCollectionTrigger } from './triggers/new-collection.trigger'
import { NewPostTrigger } from './triggers/new-post.trigger'

export class MirrorDefinition extends SingleIntegrationDefinition {
  integrationKey = 'mirror'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewPostTrigger(), new NewCollectionTrigger()]
  actions = []
}
