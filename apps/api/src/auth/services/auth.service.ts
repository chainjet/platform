import { Injectable } from '@nestjs/common'
import { getAddress } from 'ethers/lib/utils'
import { SiweMessage } from 'siwe'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'

@Injectable()
export class AuthService {
  constructor(protected readonly userService: UserService) {}

  async validateSignature(message: string, signature: string, nonce: string | null, allowExternal: boolean) {
    const siweMessage = new SiweMessage(message)
    const fields = await siweMessage.validate(signature)

    const validSignature =
      (!nonce || fields.nonce === nonce) && fields.statement === 'Sign-In on ChainJet.' && fields.version === '1'

    if (!validSignature) {
      throw new Error('Invalid Signature')
    }

    const isExternalDomain =
      fields.uri !== process.env.FRONTEND_ENDPOINT ||
      fields.domain !== process.env.FRONTEND_ENDPOINT.replace('https://', '').replace('http://', '')

    if (isExternalDomain && !allowExternal) {
      throw new Error('Invalid Domain')
    }

    return { fields, externalApp: isExternalDomain ? fields.domain : null }
  }

  async validateUserWithSignature(message: string, signature: string): Promise<{ user?: User; fields?: SiweMessage }> {
    // For ease of development, allow a mock address to be used
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_ADDRESS) {
      const user = await this.userService.findOne({ address: process.env.MOCK_ADDRESS })
      return user ? { user } : {}
    }

    const { fields, externalApp } = await this.validateSignature(message, signature, null, true)
    const user = await this.userService.findOne({ address: getAddress(fields.address) })
    if (user && user.nonces.includes(fields.nonce)) {
      // If the user is logging in from an external app, make sure they have authorized it
      if (externalApp && !user.externalApps?.[externalApp]) {
        return {}
      }

      return { user, fields }
    }
    return {}
  }
}
