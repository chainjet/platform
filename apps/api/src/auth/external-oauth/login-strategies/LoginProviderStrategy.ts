import passport, { Profile } from 'passport'

export type ProviderCallback = (err?: any, user?: any, info?: any) => void

export type LoginProvider = 'google' | 'facebook' | 'github'

export type LoginStrategyCallback = (
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: ProviderCallback,
) => any

export abstract class LoginProviderStrategy {
  constructor(readonly strategyName: string, readonly callbackURL: string) {}

  abstract strategyOptions: passport.AuthenticateOptions

  abstract registerStrategy(callback: LoginStrategyCallback): void
}
