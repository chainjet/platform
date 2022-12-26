import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { Client } from '@xmtp/xmtp-js'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { mapXmtpMessageToOutput, xmtpMessageSchema } from '../xmtp.common'

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
      throw new Error(`Missing keys for XMTP`)
    }
    const keys = new Uint8Array(credentials.keys.split(',').map((key: string) => Number(key)))
    const client = await Client.create(null, { privateKeyOverride: keys, env: 'production' })

    const conversation = await client.conversations.newConversation(inputs.address)
    const message = await conversation.send(inputs.message)

    return {
      outputs: mapXmtpMessageToOutput(message),
    }
  }
}
