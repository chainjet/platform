import { RunResponse, StepInputs } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { BlockchainConfigService } from '@blockchain/blockchain/blockchain.config'
import { getChatCompletion, getConversationMenu, getUserIntent, UserIntent } from '@chainjet/tools/dist/ai/ai'
import { BadRequestException } from '@nestjs/common'
import { Menu } from 'apps/api/src/chat/entities/menu'
import { Order, OrderState } from 'apps/api/src/chat/entities/order'
import { MenuService } from 'apps/api/src/chat/services/menu.service'
import { OrderService } from 'apps/api/src/chat/services/order.service'
import { User } from 'apps/api/src/users/entities/user'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'
import { XmtpLib } from '../../xmtp/xmtp.lib'

export class CreateOrderAction extends OperationAction {
  key = 'createOrder'
  name = 'Create Order'
  description = 'Create a new order on ChainJet'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['menu'],
    properties: {
      menu: {
        type: 'string',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      total: {
        type: 'number',
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            quantity: {
              type: 'number',
            },
          },
        },
      },
    },
  }

  async run({ inputs, user, previousOutputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.menu) {
      throw new BadRequestException(`A menu is required to create an order`)
    }
    if (!previousOutputs?.contact?.address) {
      throw new BadRequestException(`A contact address is required to create an order`)
    }
    if (inputs.requestPayment && (!Array.isArray(inputs.networks) || !inputs.networks.length)) {
      throw new BadRequestException(`At least one network is required to request payment`)
    }
    const menu = await MenuService.instance.findOne({ _id: inputs.menu, owner: user })
    if (!menu) {
      throw new BadRequestException(`Menu ${inputs.menu} not found`)
    }
    if (inputs.requestPayment && !menu.currency) {
      throw new BadRequestException(`You must set a currency on the menu before requesting payments`)
    }

    const latestMessage = previousOutputs?.message
    const latestOutputs = (previousOutputs && Object.values(previousOutputs).pop()) ?? {}
    const messages = (previousOutputs?.messages ?? []).map((message) => ({
      content: message.content,
      role: message.from === 'user' ? 'user' : 'assistant',
    }))
    const networks: number[] = (inputs.networks ?? []).map((network: number) => Number(network))

    // If we're confirming the order, check for the message intent
    if (latestOutputs.confirmingOrder) {
      const confirmIntents: UserIntent[] = [
        {
          name: 'Confirm',
          description: 'The user confirms the order without making any changes or giving any additional information.',
        },
        {
          name: 'Update',
          description: 'The user updates the order or indicates items.',
        },
        {
          name: 'Cancel',
          description: 'The user cancel or stop the order.',
        },
      ]
      const intent = await getUserIntent(confirmIntents, latestMessage?.content, messages)
      if (intent?.toLowerCase() === 'confirm') {
        const order = await this.createOrder(
          latestOutputs.conversationInfo,
          menu,
          user as User,
          previousOutputs!.contact.address,
          networks,
          !!inputs.requestPayment,
        )
        return await this.processOrderAndGetOutputs(
          latestOutputs.conversationInfo,
          menu,
          order,
          credentials,
          inputs,
          previousOutputs,
        )
      }
    }

    const originalInputs = _.cloneDeep(inputs)

    const data = await getConversationMenu(messages, menu, inputs.limit)
    if ('FollowUp' in data) {
      const client = await XmtpLib.getClient(credentials.keys, credentials.env ?? 'production')
      const conversationId = previousOutputs?.trigger.conversation.id
      await XmtpLib.sendMessage(client, conversationId, data.FollowUp, previousOutputs?.messages)
      return {
        outputs: {
          ...originalInputs,
        },
        sleepUniqueGroup: conversationId,
        repeatOnWakeUp: true,
      }
    }

    if (inputs.confirm) {
      const orderList = this.getOrderList(data).trim()
      const prompt = `Your task is to confirm with the user if the following order is correct:\n${orderList}. Ignore items not in the list on the confirmation message.`
      let content = await getChatCompletion([{ role: 'system', content: prompt }, ...messages])
      if (!content) {
        content = `Please confirm if the request is correct:\n${orderList}`
      }
      const client = await XmtpLib.getClient(credentials.keys, credentials.env ?? 'production')
      const conversationId = previousOutputs?.trigger.conversation.id
      await XmtpLib.sendMessage(client, conversationId, content, previousOutputs?.messages)
      return {
        outputs: {
          ...originalInputs,
          userMessageId: latestMessage.id,
          confirmingOrder: true,
          conversationInfo: data,
        },
        sleepUniqueGroup: conversationId,
        repeatOnWakeUp: true,
      }
    }

    const order = await this.createOrder(
      data,
      menu,
      user as User,
      previousOutputs!.contact.address,
      networks,
      !!inputs.requestPayment,
    )
    return await this.processOrderAndGetOutputs(data, menu, order, credentials, inputs, previousOutputs)
  }

  getOrderList(data: { Order: Array<{ item: string; quantity?: number }> }) {
    return data.Order.map((item) => `${item.quantity ?? 1} ${item.item}`).join('\n') + '\n'
  }

  async processOrderAndGetOutputs(
    data: { Order: Array<{ item: string; quantity?: number }> },
    menu: Menu,
    order: Order,
    credentials: StepInputs,
    inputs: StepInputs,
    previousOutputs: StepInputs,
  ) {
    const networks: number[] = (inputs.networks ?? []).map((network: number) => Number(network))
    if (inputs.requestPayment && order.total > 0) {
      let payMessage = `The order total is ${order.total} ${menu.currency}. `
      if (networks.length === 1) {
        payMessage += `You can send the payment to this address on the ${this.getNetworkName(networks[0])} network.`
      } else {
        payMessage += `You can send the payment to this address on the following networks:\n${networks
          .map((network: number) => `- ${this.getNetworkName(network)}`)
          .join('\n')}\n`
      }
      const client = await XmtpLib.getClient(credentials.keys, credentials.env ?? 'production')
      const conversationId = previousOutputs?.trigger.conversation.id
      await XmtpLib.sendMessage(client, conversationId, payMessage, previousOutputs?.messages)
      return {
        outputs: {
          ...inputs,
          confirmingPayment: true,
        },
        sleepUniqueGroup: conversationId,
        repeatOnWakeUp: true,
      }
    }

    const outputs: Record<string, any> = {
      id: order.id,
      total: data.Order.reduce((acc, item) => {
        const menuItem = menu.items.find((menuItem) => menuItem.name === item.item)
        return acc + (menuItem?.price ?? 0) * (item.quantity ?? 1)
      }, 0),
      items: data.Order.map((item) => ({
        name: item.item,
        quantity: item.quantity ?? 1,
      })),
    }
    return {
      outputs: outputs,
    }
  }

  getNetworkName(chainId: number) {
    return BlockchainConfigService.instance.get(chainId)?.name ?? `Chain ID ${chainId}`
  }

  async createOrder(
    data: { Order: Array<{ item: string; quantity?: number }> },
    menu: Menu,
    user: User,
    address: string,
    networks: number[] | undefined,
    requestPayment: boolean,
  ) {
    const total = data.Order.reduce((acc, item) => {
      const menuItem = menu.items.find((menuItem) => menuItem.name === item.item)
      return acc + (menuItem?.price ?? 0) * (item.quantity ?? 1)
    }, 0)
    return await OrderService.instance.createOne({
      owner: user,
      address,
      total,
      menu,
      currency: menu.currency,
      networks,
      waitTx: requestPayment,
      items: data.Order.map((item) => ({
        name: item.item,
        quantity: item.quantity ?? 1,
      })),
      state: total > 0 ? OrderState.PendingPayment : OrderState.PendingDelivery,
    })
  }
}
