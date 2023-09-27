import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { resolveAddressName } from '@app/definitions/utils/address.utils'
import { sendXmtpMessage } from '@chainjet/tools/dist/messages'
import { ContactService } from 'apps/api/src/chat/services/contact.service'
import { User } from 'apps/api/src/users/entities/user'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { mapXmtpMessageToOutput, xmtpMessageSchema } from '../xmtp.common'
import { XmtpLib } from '../xmtp.lib'

export class SendMessageWalletAction extends OperationOffChain {
  key = 'sendMessageWallet'
  name = 'Send a message to a wallet'
  description = 'Send a message to a given wallet'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address', 'message'],
    properties: {
      address: {
        title: 'Address',
        type: 'string',
        description: 'Wallet address to send the message to',
      },
      message: {
        title: 'Message',
        type: 'string',
        'x-ui:widget': 'textarea',
        description: 'Message to send',
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    ...xmtpMessageSchema,
  }

  async run({ inputs, credentials, user }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.keys) {
      throw new AuthenticationError(`Missing keys for XMTP`)
    }
    if (!inputs.address) {
      throw new Error(`Missing wallet address`)
    }
    if (!isAddress(inputs.address)) {
      inputs.address = await resolveAddressName(inputs.address)
      if (!isAddress(inputs.address)) {
        throw new Error(`Cannot resolve wallet address "${inputs.address}"`)
      }
    }

    const client = await XmtpLib.getClient(credentials.keys)
    const message = await sendXmtpMessage(client, inputs.address, inputs.message)
    await ContactService.instance.addSingleContact(getAddress(inputs.address), user as User)

    return {
      outputs: mapXmtpMessageToOutput(message) as any,
    }
  }
}
