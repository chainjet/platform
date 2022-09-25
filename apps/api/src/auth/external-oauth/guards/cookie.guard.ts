import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { User } from 'apps/api/src/users/entities/user'
import { AuthService } from '../../services/auth.service'

@Injectable()
export class CookieGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = await this.getUserFromContext(context)
    return !!user?.id
  }

  getTokenDataFromContext(context: ExecutionContext): { message: string; signature: string } | null {
    try {
      const cookie = context.switchToHttp().getRequest()?.headers?.cookie
      const tokenStr = decodeURIComponent(cookie.split('cj-token=')?.[1]?.split(';')?.[0])
      const { token } = JSON.parse(tokenStr)
      return JSON.parse(token)
    } catch (e) {
      return null
    }
  }

  async getUserFromContext(context: ExecutionContext): Promise<User | null> {
    try {
      const tokenData = this.getTokenDataFromContext(context)
      if (!tokenData) {
        return null
      }
      const { message, signature } = tokenData
      const { user, fields } = await this.authService.validateUserWithSignature(message, signature)
      const req = context.switchToHttp().getRequest()
      req.user = user
      req.nonce = fields?.nonce
      return user ?? null
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
