import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
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

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.keys) {
      throw new AuthenticationError(`Missing keys for XMTP`)
    }
    const client = await XmtpLib.getClient(credentials.keys)
    const conversation = await client.conversations.newConversation(inputs.address)
    const message = await conversation.send(inputs.message)

    return {
      outputs: mapXmtpMessageToOutput(message),
    }
  }
}
