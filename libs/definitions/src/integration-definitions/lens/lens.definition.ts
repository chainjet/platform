import { AuthenticationError } from '@app/common/errors/authentication-error'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { CreateCommentChainJetBotAction } from './actions/create-comment-chainjetbot.action'
import { CreateCommentAction } from './actions/create-comment.action'
import { CreatePostAction } from './actions/create-post.action'
import { FollowProfileAction } from './actions/follow-profile.action'
import { GetDefaultProfileAction } from './actions/get-default-profile.action'
import { GetPublicationAction } from './actions/get-publication.action'
import { LikePostAction } from './actions/like-post.action'
import { refreshLensAccessToken } from './lens.common'
import { NewCollectionTrigger } from './triggers/new-collection.trigger'
import { NewFollowerTrigger } from './triggers/new-follower.trigger'
import { NewMentionChainJetBotTrigger } from './triggers/new-mention-chainjetbot.trigger'
import { NewMentionTrigger } from './triggers/new-mention.trigger'
import { NewPostTrigger } from './triggers/new-post.trigger'

export class LensDefinition extends SingleIntegrationDefinition {
  integrationKey = 'lens'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [
    new NewCollectionTrigger(),
    new NewFollowerTrigger(),
    new NewMentionChainJetBotTrigger(),
    new NewMentionTrigger(),
    new NewPostTrigger(),
  ]
  actions = [
    new CreateCommentAction(),
    new CreateCommentChainJetBotAction(),
    new CreatePostAction(),
    new FollowProfileAction(),
    new GetDefaultProfileAction(),
    new GetPublicationAction(),
    new LikePostAction(),
  ]

  async refreshCredentials(credentials: Record<string, any>): Promise<Record<string, any>> {
    const refreshedCredentials = await refreshLensAccessToken(credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    return refreshedCredentials
  }
}
