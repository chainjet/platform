import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { getChatCompletion, getConversationInfo, getUserIntent, UserIntent } from '@chainjet/tools/dist/ai/ai'
import { BadRequestException } from '@nestjs/common'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { ContactService } from 'apps/api/src/chat/services/contact.service'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { User } from 'apps/api/src/users/entities/user'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import _ from 'lodash'
import { XmtpLib } from '../../xmtp/xmtp.lib'

interface Entity {
  name: string
  type: string
  description?: string
  required?: boolean
  store?: boolean
  requestMessage?: string
}

export class GetInfoAction extends OperationAction {
  key = 'getInfo'
  name = 'Get Information'
  description = 'Extrac info from the conversation'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['entities'],
    properties: {
      entities: {
        title: 'List of Entities',
        type: 'array',
        minItems: 1,
        'x-addLabel': 'Add Entity',
        items: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              examples: ['Job Title'],
              'x-noInterpolation': true,
            } as JSONSchema7Definition,
            type: {
              type: 'string',
              title: 'Type',
              default: '',
              oneOf: [
                {
                  title: 'Text',
                  const: 'text',
                },
                {
                  title: 'Number',
                  const: 'number',
                },
                {
                  title: 'Date',
                  const: 'date',
                },
                {
                  title: 'Time',
                  const: 'time',
                },
                {
                  title: 'Ethereum Address',
                  const: 'address',
                },
                {
                  title: 'Email Address',
                  const: 'email',
                },
              ],
              'x-noInterpolation': true,
            } as JSONSchema7Definition,
            description: {
              type: 'string',
              title: 'Description',
              examples: ['The job title of the user'],
              description:
                'Description of the information to extract. This helps the AI to understand what to look for. This is needed when the entity name is not intuitive enough.',
              'x-noInterpolation': true,
            } as JSONSchema7Definition,
            required: {
              type: 'boolean',
              title: 'Is required?',
              description:
                "Whether the information is required to continue. If it's required and the user doesn't provide it, the AI will ask for it.",
            },
            store: {
              type: 'boolean',
              title: 'Store in contact?',
              description: 'Whether the information should be stored in the contact.',
            },
          },
        },
      } as JSONSchema7Definition,
      confirm: {
        type: 'boolean',
        title: 'Ask for confirmation?',
        description: 'Ask the user to confirm that the information is correct before continuing?',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {},
  }

  async beforeCreate(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> {
    if (!Array.isArray(workflowAction.inputs?.entities) || !workflowAction.inputs?.entities.length) {
      return workflowAction
    }
    const entities = workflowAction.inputs.entities as Entity[]

    // Check for duplicate entity names
    const entityNames = entities.map((entity) => entity.name.toLowerCase())
    const entityNamesSet = new Set(entityNames)
    if (entityNames.length !== entityNamesSet.size) {
      throw new BadRequestException(`Duplicate entity names: ${entityNames.join(', ')}`)
    }

    // Update schema response
    workflowAction.schemaResponse = {
      type: 'object',
      properties: entities.reduce((properties: Record<string, any>, entity) => {
        properties[entity.name] = {
          type: entity.type,
          title: entity.name,
          description: entity.description,
        }
        return properties
      }, {}),
    }

    return workflowAction
  }

  async beforeUpdate(
    update: Partial<WorkflowAction>,
    prevWorkflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> {
    return this.beforeCreate(update, integrationAction, accountCredential)
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
    const entities = inputs.entities as Entity[]

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
        return await this.completeAction(
          entities,
          latestOutputs.conversationInfo,
          user as User,
          previousOutputs?.contact?.address,
        )
      }
    }

    const originalInputs = _.cloneDeep(inputs)

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
      const confirmList = entities
        .filter((entity) => data[entity.name])
        .map((entity) => `${entity.name}: ${data[entity.name]}`)
        .join('\n')
      const prompt = `Your task is to confirm with the user if the following information is correct.\n${confirmList}`
      let content = await getChatCompletion([{ role: 'system', content: prompt }, ...messages])
      if (!content) {
        content = `Please confirm if this information is correct:\n${confirmList}`
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

    return await this.completeAction(entities, data, user as User, previousOutputs?.contact?.address)
  }

  async completeAction(entities: Entity[], data: any, user: User, contactAddress?: string) {
    const storeEntities = entities.filter((entity) => entity.store)
    if (storeEntities.length && contactAddress) {
      const entitiesData = storeEntities.reduce((fields: Record<string, any>, entity) => {
        fields[entity.name] = data[entity.name]
        return fields
      }, {})
      const contact = await ContactService.instance.findOne({ address: contactAddress, owner: user })
      if (contact) {
        await ContactService.instance.updateOne(contact.id, {
          fields: {
            ...(contact.fields ?? {}),
            ...entitiesData,
          },
        })
      }
    }
    return {
      outputs: entities.reduce((outputs: Record<string, any>, entity) => {
        if (data[entity.name]) {
          outputs[entity.name] = data[entity.name]
        }
        return outputs
      }, {}),
      credits: 5,
    }
  }
}
