import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { UserService } from '../../users/services/user.service'
import { AuthService } from '../services/auth.service'
import { GqlContext } from '../typings/gql-context'

@Injectable()
export class GraphqlGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    const req = ctx.getContext().req

    const bearerToken = req?.headers?.authorization?.split('Bearer ')?.[1]
    if (bearerToken) {
      try {
        const { message, signature } = JSON.parse(bearerToken)
        const { user } = await this.authService.validateUserWithSignature(message, signature)
        if (user) {
          req.user = user
          return true
        }
      } catch {}
    }
    return false
  }

  getRequest(context: ExecutionContext): GqlContext['req'] {
    const ctx = GqlExecutionContext.create(context)
    return ctx.getContext().req
  }
}
