import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { BadRequestException } from '@nestjs/common'
import { Client } from '@xmtp/xmtp-js'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { getAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export class CheckXmtpEnabled extends OperationOffChain {
  key = 'checkXmtpEnabled'
  name = 'Check if a wallet has XMTP'
  description = 'Check if a wallet has XMTP enabled and can receive messages.'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Address',
        type: 'string',
        description: 'Wallet address to check if has XMTP enabled',
      },
    },
  }
  outputs: JSONSchema7 = {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
      },
    },
  }

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.address) {
      throw new BadRequestException('Address is required')
    }
    const address = getAddress(inputs.address)
    const enabled = await Client.canMessage(address, { env: 'production' })

    return {
      outputs: {
        enabled,
      },
    }
  }
}
