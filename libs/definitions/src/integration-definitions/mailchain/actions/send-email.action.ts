import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import MailChain from '@mailchain/sdk/internal'
import { BadRequestException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export class SendEmailAction extends OperationOffChain {
  key = 'sendEmail'
  name = 'Send an email to a wallet'
  description = 'Send a message to a given wallet'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address', 'subject', 'content'],
    properties: {
      address: {
        title: 'Address',
        type: 'string',
        description: 'Wallet address to send the message to',
      },
      subject: {
        title: 'Subject',
        type: 'string',
      },
      content: {
        title: 'Content',
        type: 'string',
        'x-ui:widget': 'textarea',
        description: 'Content of the message to send',
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      deliveries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
            },
          },
        },
      },
    },
  }

  async run({ inputs, credentials, user }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.address) {
      throw new BadRequestException(`Address is required`)
    }
    if (!credentials.privateMessagingKey || !credentials.email) {
      throw new BadRequestException(`Private messaging key and email are required`)
    }

    const recoveredPrivateMessagingKey = MailChain.privateMessagingKeyFromHex(credentials.privateMessagingKey)
    const mailSender = MailChain.MailSender.fromSenderMessagingKey(recoveredPrivateMessagingKey)

    let address: string = inputs.address
    if (!address.includes('@')) {
      if (isAddress(address)) {
        address = `${address}@ethereum.mailchain.com`
      } else if (address.endsWith('.eth') || address.endsWith('.cb.id')) {
        address = `${address}@ens.mailchain.com`
      } else if (address.endsWith('.lens')) {
        address = `${inputs.address}@lens.mailchain.com`
      } else if (address.endsWith('.near')) {
        address = `${address}@near.mailchain.com`
      } else if (address.endsWith('.tez')) {
        address = `${address}@tezosdomains.mailchain.com`
      } else if (
        address.endsWith('.888') ||
        address.endsWith('.blockchain') ||
        address.endsWith('.crypto') ||
        address.endsWith('.dao') ||
        address.endsWith('.nft') ||
        address.endsWith('.wallet') ||
        address.endsWith('.x')
      ) {
        address = `${address}@unstoppable.mailchain.com`
      } else if (address.endsWith('.aurora') || address.endsWith('.hodl')) {
        address = `${address}@freename.mailchain.com`
      } else {
        throw new BadRequestException(`Address is not valid`)
      }
    } else {
      address = inputs.address
    }

    if (!address.endsWith('mailchain.com')) {
      address = `${address}.mailchain.com`
    }

    const res = await mailSender.sendMail({
      from: credentials.email,
      to: [address],
      subject: inputs.subject,
      content: {
        text: inputs.content,
        html: inputs.content,
      },
    })
    if (!res?.data?.sentMailDeliveryRequests?.[0]?.deliveryRequestId) {
      if (res?.error?.message) {
        throw new Error(`Sending email failed with error: ${res.error.message}`)
      } else {
        throw new Error(`Sending email failed with unknown error`)
      }
    }

    return {
      outputs: {
        deliveryRequestIds: res.data.sentMailDeliveryRequests.map((d) => ({ requestId: d.deliveryRequestId })),
      },
    }
  }
}
