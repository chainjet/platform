import { SecurityUtils } from '@app/common/utils/security.utils'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'
import { GqlUserContext } from '../typings/gql-context'

@Injectable()
export class AuthService {
  constructor(protected readonly jwtService: JwtService, protected readonly userService: UserService) {}

  generateAccessToken(user: User): { accessToken: string; accessTokenExpiration: Date } {
    const accessToken = this.jwtService.sign({
      id: user.id,
      username: user.username,
    })

    // TODO move to config
    const expiration = 1000 * 60 * 60 * 7 // 1 week

    return {
      accessToken,
      accessTokenExpiration: new Date(Date.now() + expiration),
    }
  }

  async generateAndSaveRefreshToken(user: User): Promise<string> {
    const plainRefreshToken = SecurityUtils.generateRandomString(48)
    const refreshTokenHash = await SecurityUtils.hashWithBcrypt(plainRefreshToken, 12)
    await this.userService.updateOne(user.id, { refreshTokenHash })
    return plainRefreshToken
  }

  async generateAndSaveResetPasswordToken(user: User): Promise<string> {
    const plainResetPasswordToken = SecurityUtils.generateRandomString(48)
    const resetPasswordToken = await SecurityUtils.hashWithBcrypt(plainResetPasswordToken, 12)
    await this.userService.updateOne(user.id, { resetPasswordToken })
    return plainResetPasswordToken
  }

  decodeAccessToken(accessToken: string): GqlUserContext {
    return this.jwtService.decode(accessToken) as GqlUserContext
  }

  blacklistedUsername(username: string): boolean {
    return [
      'api',
      'graphql',
      'hooks',
      'login',
      'register',
      'settings',
      'legal',
      'credentials',
      'integrations',
      'pricing',

      'oauth',
      'apps',
      'docs',
    ].includes(username)
  }
}
