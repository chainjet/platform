import { AuthenticationError } from '@app/common/errors/authentication-error'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { CreatePostAction } from './actions/create-post.action'
import { FollowProfileAction } from './actions/follow-profile.action'
import { refreshLensAccessToken } from './lens.common'
import { NewFollowerTrigger } from './triggers/new-follower.trigger'
import { NewMentionTrigger } from './triggers/new-mention.trigger'
import { NewPostTrigger } from './triggers/new-post.trigger'

export class LensDefinition extends SingleIntegrationDefinition {
  integrationKey = 'lens'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewFollowerTrigger(), new NewPostTrigger(), new NewMentionTrigger()]
  actions = [new FollowProfileAction(), new CreatePostAction()]

  async refreshCredentials(credentials: Record<string, any>): Promise<Record<string, any>> {
    const refreshedCredentials = await refreshLensAccessToken(credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    return refreshedCredentials
  }
}
