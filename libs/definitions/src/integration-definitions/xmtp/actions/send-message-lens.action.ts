import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { Client } from '@xmtp/xmtp-js'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { getLensDefaultProfile, getLensProfile } from '../../lens/lens.common'
import { mapXmtpMessageToOutput, xmtpMessageSchema } from '../xmtp.common'

export class SendMessageAddressAction extends OperationOffChain {
  key = 'sendMessageLens'
  name = 'Send a message to a Lens handle'
  description = 'Send a message to a given lens handle'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['handle', 'message'],
    properties: {
      handle: {
        title: 'Lens Handle',
        type: 'string',
        description: 'Lens handle to send the message to (i.e. chainjet.lens)',
        examples: ['chainjet.lens'],
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
    const keys = new Uint8Array(credentials.keys.split(',').map((key: string) => Number(key)))
    const client = await Client.create(null, { privateKeyOverride: keys, env: 'production' })
    const senderProfile = await getLensDefaultProfile(client.address)
    const receiverProfile = await getLensProfile(inputs.handle)
    if (!receiverProfile) {
      throw new Error(
        `Could not find profile for handle: ${inputs.handle}. ${
          !inputs.handle.endsWith('.lens') ? 'You might need to enter .lens at the end of the handle.' : ''
        }`,
      )
    }

    const senderId = parseInt(senderProfile.id.substring(2), 16)
    const receiverId = parseInt(receiverProfile.id.substring(2), 16)
    const conversationId =
      senderId < receiverId
        ? `lens.dev/dm/${senderProfile.id}-${receiverProfile.id}`
        : `lens.dev/dm/${receiverProfile.id}-${senderProfile.id}`

    const conversation = await client.conversations.newConversation(receiverProfile.ownedBy, {
      conversationId: conversationId,
      metadata: {},
    })
    const message = await conversation.send(inputs.message)

    return {
      outputs: mapXmtpMessageToOutput(message),
    }
  }
}
