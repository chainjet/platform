import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { getLensDefaultProfile, getLensProfile } from '../../lens/lens.common'
import { mapXmtpMessageToOutput, xmtpMessageSchema } from '../xmtp.common'
import { XmtpLib } from '../xmtp.lib'

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
        description: 'Lens handle to send the message to (e.g. chainjet.lens)',
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
    const client = await XmtpLib.getClient(credentials.keys)
    const senderProfile = await getLensDefaultProfile(client.address)

    if (!inputs.handle) {
      throw new Error(`Lens handle is required`)
    }

    let handle = inputs.handle
    if (handle.startsWith('0x') && isAddress(handle)) {
      const defaultProfile = await getLensDefaultProfile(handle)
      if (!defaultProfile) {
        throw new Error(`Address ${handle} does not have a default Lens profile`)
      }
      handle = defaultProfile.handle
    }

    const receiverProfile = await getLensProfile(handle)

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
      outputs: mapXmtpMessageToOutput(message) as any,
    }
  }
}
