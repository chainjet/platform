import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { GqlUserContext } from '../typings/gql-context'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor (configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET')
    })
  }

  validate (payload: GqlUserContext): GqlUserContext {
    return payload
  }
}
