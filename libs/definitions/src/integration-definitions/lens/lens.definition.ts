import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { CreatePostAction } from './actions/create-post.action'
import { FollowProfileAction } from './actions/follow-profile.action'
import { NewFollowerTrigger } from './triggers/new-follower.trigger'
import { NewMentionTrigger } from './triggers/new-mention.trigger'
import { NewPostTrigger } from './triggers/new-post.trigger'

export class LensDefinition extends SingleIntegrationDefinition {
  integrationKey = 'lens'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewFollowerTrigger(), new NewPostTrigger(), new NewMentionTrigger()]
  actions = [new FollowProfileAction(), new CreatePostAction()]
}
