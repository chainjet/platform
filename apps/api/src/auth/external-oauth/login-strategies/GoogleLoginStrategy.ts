import passport from 'passport'
import { Strategy } from 'passport-google-oauth20'
import { LoginProviderStrategy, LoginStrategyCallback } from './LoginProviderStrategy'

export class GoogleLoginStrategy extends LoginProviderStrategy {
  strategyOptions = {
    scope: ['profile', 'email'],
  }

  constructor(readonly strategyName: string, readonly callbackURL: string) {
    super(strategyName, callbackURL)
  }

  registerStrategy(callback: LoginStrategyCallback): void {
    passport.use(
      this.strategyName,
      new Strategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID ?? '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
          callbackURL: this.callbackURL,
        },
        callback,
      ),
    )
  }
}
