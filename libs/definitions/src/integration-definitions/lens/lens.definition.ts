import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { FollowProfileAction } from './actions/follow-profile.action'
import { NewFollowerTrigger } from './triggers/new-follower.trigger'
import { NewPostTrigger } from './triggers/new-post.trigger'

export class LensDefinition extends SingleIntegrationDefinition {
  integrationKey = 'lens'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewFollowerTrigger(), new NewPostTrigger()]
  actions = [new FollowProfileAction()]
}
