import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { OrderService } from 'apps/api/src/chat/services/order.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export class UpdateOrderAction extends OperationOffChain {
  key = 'updateOrder'
  name = 'Update Order'
  description = 'Attach data to a specific contact'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['order'],
    properties: {
      order: {
        title: 'Order ID',
        type: 'string',
        description: 'The ID of the order to update. You can select the output of the "Create Order" action.',
      } as JSONSchema7Definition,
      status: {
        title: 'Status',
        type: 'string',
        oneOf: [
          {
            title: 'Do Not Update',
            const: '',
          },
          {
            title: 'Pending Payment',
            const: 'pending-payment',
          },
          {
            title: 'Pending Delivery',
            const: 'pending-delivery',
          },
          {
            title: 'Completed',
            const: 'completed',
          },
        ],
        default: '',
        description: 'The status of the order',
      },
      fields: {
        title: 'Order Data',
        type: 'object',
        description: 'Attach additional data to the order',
        additionalProperties: true,
        'x-addLabel': 'Add Field',
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    properties: {},
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.order) {
      throw new BadRequestException('Order ID is required')
    }
    const order = await OrderService.instance.findOne({ _id: inputs.order, owner: user!.id })
    if (!order) {
      throw new NotFoundException(`Order ${inputs.order} not found`)
    }
    await OrderService.instance.updateOneNative(
      {
        _id: order._id,
      },
      {
        $set: {
          ...(inputs.status ? { state: inputs.status } : {}),
          ...(inputs.fields ? { fields: { ...order.fields, ...inputs.fields } } : {}),
        },
      },
    )
    return {
      outputs: {},
    }
  }
}
