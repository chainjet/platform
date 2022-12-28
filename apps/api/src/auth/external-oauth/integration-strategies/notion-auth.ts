import OAuth2Strategy from 'passport-oauth2'

class NotionPassportStrategy extends OAuth2Strategy {
  name = 'notion'

  constructor(options: OAuth2Strategy.StrategyOptions, verify: OAuth2Strategy.VerifyFunction) {
    options.customHeaders = {
      Authorization: `Basic ${Buffer.from(`${options.clientID}:${options.clientSecret}`).toString('base64')}`,
    }
    super(options, verify)
  }
}

export const Strategy = NotionPassportStrategy
