import passport from 'passport'
import { Strategy } from 'passport-github2'
import { LoginProviderStrategy, LoginStrategyCallback } from './LoginProviderStrategy'

export class GithubLoginStrategy extends LoginProviderStrategy {
  strategyOptions = {
    scope: ['user:email'],
  }

  constructor(readonly strategyName: string, readonly callbackURL: string) {
    super(strategyName, callbackURL)
  }

  registerStrategy(callback: LoginStrategyCallback): void {
    passport.use(
      this.strategyName,
      new Strategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID ?? '',
          clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
          callbackURL: this.callbackURL,
          scope: ['user:email'],
        },
        callback,
      ),
    )
  }
}
