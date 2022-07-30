import passport from 'passport'
import { Strategy } from 'passport-facebook'
import { LoginProviderStrategy, LoginStrategyCallback } from './LoginProviderStrategy'

export class FacebookLoginStrategy extends LoginProviderStrategy {
  strategyOptions = {
    scope: ['email']
  }

  constructor (readonly strategyName: string, readonly callbackURL: string) {
    super(strategyName, callbackURL)
  }

  registerStrategy (callback: LoginStrategyCallback): void {
    passport.use(this.strategyName, new Strategy({
      clientID: process.env.FACEBOOK_CLIENT_ID ?? '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? '',
      callbackURL: this.callbackURL,
      profileFields: ['id', 'emails', 'displayName']
    }, callback))
  }
}
