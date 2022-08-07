import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { AuthGuard } from '@nestjs/passport'
import { firstValueFrom } from 'rxjs'
import { UserService } from '../../users/services/user.service'
import { AuthPayload } from '../typings/AccessToken'
import { GqlContext } from '../typings/gql-context'

@Injectable()
export class GraphqlGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly userService: UserService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    const req = ctx.getContext().req

    // Support for API Tokens
    if (req.headers.authorization?.startsWith('Bearer') && req.headers.authorization.includes(':')) {
      const token = req.headers.authorization.replace('Bearer', '').trim()
      const [username, apiKey] = token.split(':')
      const user = await this.userService.findOne({ username })
      if (user && apiKey && (user.apiKey === apiKey || user.apiKey === `${username}:${apiKey}`)) {
        ;(req.user as AuthPayload) = {
          id: user.id,
        }
        return true
      }
      return false
    }

    const canActivate = await super.canActivate(context)
    if (typeof canActivate === 'boolean') {
      return canActivate
    }
    return await firstValueFrom(canActivate)
  }

  getRequest(context: ExecutionContext): GqlContext['req'] {
    const ctx = GqlExecutionContext.create(context)
    return ctx.getContext().req
  }
}
