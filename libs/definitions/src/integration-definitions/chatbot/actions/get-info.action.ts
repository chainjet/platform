import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { getChatCompletion, getConversationInfo, getUserIntent, UserIntent } from '@chainjet/tools/dist/ai/ai'
import { NotFoundException } from '@nestjs/common'
import { Menu } from 'apps/api/src/chat/entities/menu'
import { MenuService } from 'apps/api/src/chat/services/menu.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'
import { XmtpLib } from '../../xmtp/xmtp.lib'

export class GetInfoAction extends OperationAction {
  key = 'getInfo'
  name = 'Get Information'
  description = 'Extrac info from the conversation'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['conversationId'],
    properties: {
      entities: {
        type: 'array',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {},
  }

  async run({ user, inputs, previousOutputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.keys) {
      throw new AuthenticationError(`Missing keys for XMTP`)
    }
    if (!inputs.entities?.length) {
      return {
        outputs: {},
      }
    }

    const latestMessage = previousOutputs?.message
    const latestOutputs = (previousOutputs && Object.values(previousOutputs).pop()) ?? {}
    const messages = (previousOutputs?.messages ?? []).map((message) => ({
      content: message.content,
      role: message.from === 'user' ? 'user' : 'assistant',
    }))
    const entities = inputs.entities
    const menuIds = entities.filter((entity) => entity.type === 'order').map((entity) => entity.menu)
    const menus = await MenuService.instance.find({ owner: user, _id: { $in: menuIds } })

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
        return {
          outputs: {
            ...this.getInfoOutputs(entities, latestOutputs.conversationInfo, menus),
          },
          learnResponseWorkflow: true,
        }
      }
    }

    const originalInputs = _.cloneDeep(inputs)

    for (const entity of entities) {
      if (entity.type === 'order') {
        entity.menu = menus.find((menu) => menu._id.toString() === entity.menu.toString())
        if (!entity.menu) {
          throw new NotFoundException(`Menu ${entity.menu} not found`)
        }
      }
    }

    const data = await getConversationInfo(entities, messages)
    if (data.FollowUp) {
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
      const orderList = this.getOrderList(entities, data).trim()
      const prompt = `Your task is to confirm with the user if the following order is correct.\n${orderList}`
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

    return {
      outputs: {
        ...this.getInfoOutputs(entities, data, menus),
      },
      learnResponseWorkflow: true,
    }
  }

  getOrderList(entities: any[], data: any) {
    let orderList = ''
    for (const entity of entities) {
      if (!data[entity.name]) {
        continue
      }
      if (entity.type === 'order') {
        orderList += data[entity.name].map((item) => `${item.quantity ?? 1} ${item.item}`).join('\n') + '\n'
      } else {
        orderList += `${entity.name}: ${data[entity.name]}\n`
      }
    }
    return orderList
  }

  getInfoOutputs(entities: any[], data: any, menus: Menu[]) {
    const outputs: Record<string, any> = {}
    for (const entity of entities) {
      if (data[entity.name]) {
        if (entity.type === 'order') {
          const menu = menus.find((menu) => menu._id.toString() === entity.menu.toString())
          const total = data[entity.name].reduce((acc, item) => {
            const menuItem = menu!.items.find((menuItem) => menuItem.name === item.item)
            return acc + (menuItem?.price ?? 0) * (item.quantity ?? 1)
          }, 0)
          outputs[entity.name] = {
            ...(total && { total, currency: menu?.currency }),
            items: data[entity.name].map((item) => ({
              name: item.item,
              quantity: item.quantity,
            })),
          }
        } else {
          outputs[entity.name] = data[entity.name]
        }
      }
    }
    return outputs
  }
}
