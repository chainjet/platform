import {
  CACHE_MANAGER,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common'
import { Cache } from 'cache-manager'
import { Request, Response } from 'express'
import { generateNonce } from 'siwe'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'
import { NotAuthRequiredCookieGuard } from '../external-oauth/guards/cookie.guard'
import { AuthService } from '../services/auth.service'

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post('nonce')
  async getNonce(@Req() req: Request, @Session() session: Record<string, any>) {
    const nonce = generateNonce()
    if (req.body.uuid) {
      await this.cacheManager.set(`siwe-nonce:${req.body.uuid}`, nonce, { ttl: 60 * 10 } as any)
    } else {
      session.nonce = nonce
    }
    return nonce
  }

  @Post('login')
  async loginWithSignature(
    @Req() req: Request,
    @Session() session: Record<string, any>,
  ): Promise<{ ok: boolean; error?: string }> {
    const { message, signature, uuid } = req.body
    if (!uuid && !session.nonce) {
      throw new HttpException({ ok: false, error: 'Expired' }, HttpStatus.BAD_REQUEST)
    }
    let nonce: string
    if (uuid) {
      nonce = (await this.cacheManager.get(`siwe-nonce:${uuid}`)) as string
      if (!nonce) {
        throw new HttpException({ ok: false, error: 'Expired' }, HttpStatus.BAD_REQUEST)
      }
    } else {
      nonce = session.nonce
    }
    try {
      const { fields, externalApp } = await this.authService.validateSignature(message, signature, nonce, true)
      if (uuid) {
        await this.cacheManager.del(`siwe-nonce:${uuid}`)
      }
      await this.userService.createAccountFromSignature(fields, externalApp)
      return { ok: true }
    } catch (e) {
      throw new HttpException({ ok: false, error: e.message }, HttpStatus.UNPROCESSABLE_ENTITY)
    }
  }

  @UseGuards(NotAuthRequiredCookieGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response, @Session() session: Record<string, any>) {
    if (req.user) {
      const user = req.user as User
      const nonce = (req as any).nonce as string
      if (user && nonce && user.nonces.includes(nonce)) {
        user.nonces = user.nonces.filter((un) => un !== nonce)
        await this.userService.updateById(user._id, { nonces: user.nonces })
      }
    }
    try {
      session.destroy(() => {})
    } catch {}
    res.clearCookie('cj-token', { path: '/', domain: '.chainjet.io' })
    res.send({ success: true })
    return { ok: true }
  }

  @Post('delete-cookie')
  async deleteCookie(@Res() res: Response) {
    res.clearCookie('cj-token', { path: '/', domain: '.chainjet.io' })
    res.send({ success: true })
    return { ok: true }
  }
}
