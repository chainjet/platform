import {
  Controller,
  Get,
  Logger,
  Next,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { mongoose } from '@typegoose/typegoose'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationService } from 'apps/api/src/integrations/services/integration.service'
import CryptoJS from 'crypto-js'
import { NextFunction, Request, Response } from 'express'
import _ from 'lodash'
import { OAuth } from 'oauth'
import passport from 'passport'
import path from 'path'
import { AccountCredentialService } from '../../../account-credentials/services/account-credentials.service'
import { GqlUserContext } from '../../typings/gql-context'
import { NotAuthRequiredCookieGuard } from '../guards/cookie.guard'
import { OAuthResponse, OAuthStrategyFactory } from '../oauth-strategy.factory'

@Controller('account-credentials')
export class ExternalOAuthController {
  private readonly logger: Logger = new Logger(ExternalOAuthController.name)

  constructor(
    private readonly oauthStrategyFactory: OAuthStrategyFactory,
    private readonly integrationService: IntegrationService,
    private readonly integrationAccountService: IntegrationAccountService,
    private readonly accountCredentialService: AccountCredentialService,
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

  @UseGuards(NotAuthRequiredCookieGuard)
  @Get('oauth/:key/callback')
  async completeOAuth(
    @Param('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: Record<string, any>,
  ): Promise<void> {
    if (!req.user) {
      const queryString = Object.entries(req.query)
        .map(([key, value]) => `key=${value}`)
        .join('&')
      res.redirect(`${process.env.FRONTEND_ENDPOINT}/login?adding_integration_account=${key}&${queryString}`)
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

      const customStrategyClass = await this.oauthStrategyFactory.getCustomStrategy(
        oauthResponse.integrationAccount.customStrategyKey,
      )
      if (customStrategyClass?.afterAuthHook) {
        credentials = await customStrategyClass.afterAuthHook(credentials)
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

      if (session.redirectTo && session.redirectTo.startsWith('/')) {
        res.redirect(session.redirectTo)
      } else {
        res.sendFile(path.resolve('apps/api/src/auth/external-oauth/views/oauth-response.html'))
      }
    })
  }

  @Post('oauth1-sign/:key')
  async signOauthCredentials(@Param('key') key: string, @Req() req: Request) {
    const { token, requestData } = req.body ?? {}
    const integration = await this.integrationService.findOne({ key })
    if (!integration || !integration.integrationAccount) {
      throw new NotFoundException(`Integration with key ${key} not found`)
    }
    const integrationAccount = await this.integrationAccountService.findById(
      integration.integrationAccount._id.toString(),
    )
    if (!integrationAccount) {
      throw new NotFoundException(`Integration account with key ${key} not found`)
    }
    const consumerKey = process.env[`${integrationAccount.key.toUpperCase()}_CONSUMER_KEY`] ?? ''
    const consumerSecret = process.env[`${integrationAccount.key.toUpperCase()}_CONSUMER_SECRET`] ?? ''
    const requestTokenURL = integrationAccount.securitySchema?.['x-requestTokenURL']
    const accessTokenURL = integrationAccount.securitySchema?.['x-accessTokenURL']
    const signatureMethod = integrationAccount.securitySchema?.['x-signatureMethod']
    return new OAuth(
      requestTokenURL,
      accessTokenURL,
      consumerKey,
      consumerSecret,
      '1.0',
      '',
      signatureMethod,
    ).authHeader(requestData.url.toString(), token.key, token.secret, requestData.method)
  }
}
