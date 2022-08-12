import { Controller, Get, Logger, Next, Param, Req, Res, Session, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { mongoose } from '@typegoose/typegoose'
import CryptoJS from 'crypto-js'
import { NextFunction, Request, Response } from 'express'
import _ from 'lodash'
import passport, { Profile } from 'passport'
import path from 'path'
import { AccountCredentialService } from '../../../account-credentials/services/account-credentials.service'
import { UserService } from '../../../users/services/user.service'
import { GqlUserContext } from '../../typings/gql-context'
import { NotAuthRequiredCookieGuard } from '../guards/cookie.guard'
import { LoginProvider } from '../login-strategies/LoginProviderStrategy'
import { OAuthResponse, OAuthStrategyFactory } from '../oauth-strategy.factory'

@Controller('account-credentials')
export class ExternalOAuthController {
  private readonly logger: Logger = new Logger(ExternalOAuthController.name)

  constructor(
    private readonly oauthStrategyFactory: OAuthStrategyFactory,
    private readonly accountCredentialService: AccountCredentialService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Get('oauth/:key')
  async startOAuth(
    @Param('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
    @Session() session: Record<string, any>,
  ): Promise<void> {
    session.authenticatingKey = key
    session.redirectTo = undefined
    session.oAuthLogin = undefined

    if (req.query.login) {
      await this.startLoginOAuth(key, req, res, next, session)
    } else {
      await this.startIntegrationOAuth(key, req, res, next, session)
    }
  }

  async startIntegrationOAuth(
    key: string,
    req: Request,
    res: Response,
    next: NextFunction,
    session: Record<string, any>,
  ): Promise<void> {
    const integrationAccount = await this.oauthStrategyFactory.ensureStrategy(key)

    const customInstallUrl = integrationAccount.securitySchema?.['x-customInstallUrl']
    if (customInstallUrl) {
      if (typeof customInstallUrl === 'string') {
        res.redirect(integrationAccount.securitySchema?.['x-customInstallUrl'])
      } else {
        res.redirect(process.env[`${integrationAccount.key.toUpperCase()}_INSTALL_URL`] ?? '')
      }
      return
    }

    passport.authenticate(this.oauthStrategyFactory.getOAuthStrategyName(key), {
      // scope: [] // TODO
    })(req, res, next)
  }

  async startLoginOAuth(
    key: string,
    req: Request,
    res: Response,
    next: NextFunction,
    session: Record<string, any>,
  ): Promise<void> {
    session.oAuthLogin = true
    const provider = key as LoginProvider
    const strategy = this.oauthStrategyFactory.ensureLoginProviderStrategy(provider)
    passport.authenticate(strategy.strategyName, strategy.strategyOptions)(req, res, next)
  }

  @UseGuards(NotAuthRequiredCookieGuard)
  @Get('oauth/:key/callback')
  async completeOAuth(
    @Param('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: Record<string, any>,
  ): Promise<void> {
    if (session.oAuthLogin) {
      await this.completeLoginOAuth(key, req, res, session)
    } else {
      await this.completeIntegrationOAuth(key, req, res, session)
    }
  }

  async completeIntegrationOAuth(
    key: string,
    req: Request,
    res: Response,
    session: Record<string, any>,
  ): Promise<void> {
    if (!req.user) {
      const queryString = Object.entries(req.query)
        .map(([key, value]) => `key=${value}`)
        .join('&')
      res.redirect(`${process.env.FRONTEND_ENDPOINT}/register?adding_integration_account=${key}&${queryString}`)
      return
    }

    if (req.query.adding_integration_account) {
      session.authenticatingKey = req.query.adding_integration_account.toString()
    }
    if (req.query.redirect_to) {
      session.redirectTo = req.query.redirect_to.toString()
    }

    const authKey = session.authenticatingKey

    // Extract the user from the request now, since passport.authenticate will override it with the external auth data
    const user = req.user as GqlUserContext

    await this.oauthStrategyFactory.ensureStrategy(authKey)

    passport.authenticate(this.oauthStrategyFactory.getOAuthStrategyName(authKey))(req, res, async () => {
      const oauthResponse = req.user as OAuthResponse
      let credentials: Record<string, string | undefined>

      if (oauthResponse.type === 'oauth1') {
        if (!oauthResponse.token) {
          return res.status(400).send('Token expired, please try again.')
        }
        credentials = {
          token: oauthResponse.token,
          tokenSecret: oauthResponse.tokenSecret,
        }
      } else {
        if (!oauthResponse.accessToken) {
          this.logger.debug(`No access token found in oauth response (req.user: ${JSON.stringify(req.user)})`)
          return res.status(400).send(req.query.error_description ?? 'Access token expired, please try again.')
        }
        credentials = {
          accessToken: oauthResponse.accessToken,
          refreshToken: oauthResponse.refreshToken,
        }
      }

      const credentialKey = this.configService.get('CREDENTIALS_AES_KEY')
      if (!credentialKey) {
        throw new Error('Credentials encryption key not set')
      }

      const credentialsFromQueryString = _.pick(
        req.query as Record<string, any>,
        oauthResponse.integrationAccount.queryStringCredentials,
      )
      if (!_.isEmpty(credentialsFromQueryString)) {
        credentials = {
          ...credentials,
          ...credentialsFromQueryString,
        }
      }

      await this.accountCredentialService.createOne({
        owner: new mongoose.Types.ObjectId(user.id),
        name: `${oauthResponse.integrationAccount.name} account`, // TODO get username, email or ID and include it here
        integrationAccount: new mongoose.Types.ObjectId(oauthResponse.integrationAccount.id),
        encryptedCredentials: CryptoJS.AES.encrypt(JSON.stringify(credentials), credentialKey).toString(),
      })

      if (session.redirectTo) {
        res.redirect(session.redirectTo)
      } else {
        res.sendFile(path.resolve('apps/api/src/auth/external-oauth/views/oauth-response.html'))
      }
    })
  }

  async completeLoginOAuth(key: string, req: Request, res: Response, session: Record<string, any>): Promise<void> {
    const provider = key as LoginProvider
    const strategy = this.oauthStrategyFactory.ensureLoginProviderStrategy(provider)
    passport.authenticate(strategy.strategyName)(req, res, async () => {
      if (!req.user) {
        res.send('Unexpected error, please try again.')
        return
      }
      const { providerKey, profile } = req.user as { providerKey: LoginProvider; profile: Profile }

      const primaryEmail = profile.emails?.length
        ? { ...(profile?.emails?.[0] as { value: string; verified?: boolean }) }
        : null

      const user = primaryEmail?.value ? await this.userService.findOne({ email: primaryEmail.value }) : null
      const { userProviderId, completeAuthCode } = await this.userService.createOrUpdateAccountFromLoginProvider(
        user,
        providerKey,
        profile,
        primaryEmail,
      )
      const completeAuthPath = `${process.env.FRONTEND_ENDPOINT}/login/complete-auth?id=${userProviderId}&code=${completeAuthCode}`
      if (user) {
        res.redirect(completeAuthPath)
      } else {
        res.redirect(`${completeAuthPath}&completeUsername=true&completeEmail=true&email=${primaryEmail?.value ?? ''}`)
      }
    })
  }
}
