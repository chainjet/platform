import { Injectable } from '@nestjs/common'
import { getAddress } from 'ethers/lib/utils'
import { SiweMessage } from 'siwe'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'

@Injectable()
export class AuthService {
  constructor(protected readonly userService: UserService) {}

  async validateSignature(message: string, signature: string, nonce: string | null) {
    const siweMessage = new SiweMessage(message)
    const fields = await siweMessage.validate(signature)

    const validSignature =
      (!nonce || fields.nonce === nonce) &&
      fields.statement === 'Sign-In on ChainJet.' &&
      fields.version === '1' &&
      fields.uri === process.env.FRONTEND_ENDPOINT &&
      fields.domain === process.env.FRONTEND_ENDPOINT.replace('https://', '').replace('http://', '')

    if (!validSignature) {
      throw new Error('Invalid Signature')
    }

    return fields
  }

  async validateUserWithSignature(message: string, signature: string): Promise<{ user?: User; fields?: SiweMessage }> {
    const fields = await this.validateSignature(message, signature, null)
    const user = await this.userService.findOne({ address: getAddress(fields.address) })
    if (user && user.nonces.includes(fields.nonce)) {
      return { user, fields }
    }
    return {}
  }
}
