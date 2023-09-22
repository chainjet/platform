import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { OrderService } from 'apps/api/src/chat/services/order.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export class GetLatestOrderAction extends OperationOffChain {
  key = 'getLatestOrder'
  name = 'Get Latest Order'
  description = 'Get the latest order made by an address'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Wallet address',
        type: 'string',
        description: 'The wallet address to search the latest order for',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        title: 'Order Id',
        type: 'string',
      },
    },
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.address || !isAddress(inputs.address)) {
      throw new BadRequestException('The address is not valid')
    }
    const address = getAddress(inputs.address)
    const order = await OrderService.instance.findOne({ address, owner: user!.id }, {}, { sort: { _id: -1 } })
    if (!order) {
      throw new NotFoundException(`No orders found or address ${address}`)
    }
    return {
      outputs: {
        id: order._id,
      },
    }
  }
}
