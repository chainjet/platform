import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { NewFollowerTrigger } from './triggers/new-follower.trigger'
import { NewPostTrigger } from './triggers/new-post.trigger'

export class LensDefinition extends SingleIntegrationDefinition {
  integrationKey = 'lens'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewFollowerTrigger(), new NewPostTrigger()]
  actions = []
}
