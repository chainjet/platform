import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { AuthService } from '../../services/auth.service'
import { GqlUserContext } from '../../typings/gql-context'

@Injectable()
export class CookieGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const user = this.getUserFromContext(context)
    context.switchToHttp().getRequest().user = user
    return !!user?.id
  }

  getAccessTokenContext(context: ExecutionContext): string | null {
    try {
      const cookie = context.switchToHttp().getRequest()?.headers?.cookie
      const tokenStr = decodeURIComponent(cookie.split('cj-token=')?.[1]?.split(';')?.[0])
      const { accessToken } = JSON.parse(tokenStr)
      return accessToken
    } catch (e) {
      return null
    }
  }

  getUserFromContext(context: ExecutionContext): GqlUserContext | null {
    try {
      const accessToken = this.getAccessTokenContext(context)
      if (!accessToken) {
        return null
      }
      // TODO renew access token if expired (using refresh token from cookies)
      return this.authService.decodeAccessToken(accessToken)
    } catch {
      return null
    }
  }
}

/**
 * Loads the user from cookies into the request, but allows the request to continue
 */
export class NotAuthRequiredCookieGuard extends CookieGuard {
  async canActivate(context: ExecutionContext): Promise<true> {
    await super.canActivate(context)
    return true
  }
}
