import { Controller, HttpException, HttpStatus, Post, Req, Session, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { generateNonce } from 'siwe'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'
import { CookieGuard } from '../external-oauth/guards/cookie.guard'
import { AuthService } from '../services/auth.service'

@Controller('auth')
export class AuthController {
  constructor(private userService: UserService, private authService: AuthService) {}

  @Post('nonce')
  async getNonce(@Session() session: Record<string, any>) {
    session.nonce = generateNonce()
    return session.nonce
  }

  @Post('login')
  async loginWithSignature(
    @Req() req: Request,
    @Session() session: Record<string, any>,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!session.nonce) {
      throw new HttpException({ ok: false, error: 'Expired' }, HttpStatus.BAD_REQUEST)
    }
    const { message, signature } = req.body
    try {
      const { fields, externalApp } = await this.authService.validateSignature(message, signature, session.nonce, true)
      await this.userService.createAccountFromSignature(fields, externalApp)
      return { ok: true }
    } catch (e) {
      throw new HttpException({ ok: false, error: e.message }, HttpStatus.UNPROCESSABLE_ENTITY)
    }
  }

  @UseGuards(CookieGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Session() session: Record<string, any>) {
    const user = req.user as User
    const nonce = (req as any).nonce as string
    if (user && nonce && user.nonces.includes(nonce)) {
      user.nonces = user.nonces.filter((un) => un !== nonce)
      await this.userService.updateById(user._id, { nonces: user.nonces })
    }
    session.destroy(() => {})
    return { ok: true }
  }
}
