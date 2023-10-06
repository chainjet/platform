import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { getUserIntent } from '@chainjet/tools'
import { UserIntent } from '@chainjet/tools/dist/ai/ai'
import { BadRequestException } from '@nestjs/common'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowNextAction } from 'apps/api/src/workflow-actions/entities/workflow-next-action'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export class GetUserIntentAction extends OperationAction {
  key = 'getUserIntent'
  name = 'User Intent'
  description = 'Use AI to determine the user intent'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['message'],
    properties: {
      message: {
        title: 'User Message',
        type: 'string',
        'x-if:chatbot': {
          'x-ui:widget': 'hidden',
          default: '{{message.content}}',
        },
      } as JSONSchema7Definition,
      intents: {
        title: 'List of User Intents',
        type: 'array',
        items: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              examples: ['Place an order'],
              'x-noInterpolation': true,
            },
            description: {
              type: 'string',
              title: 'Description',
              examples: ['The user wants to purchase or order something.'],
              'x-noInterpolation': true,
            },
          },
          minItems: 1,
          'x-addLabel': 'Add Intent',
        },
        description: 'List of user intents to match against. You will be able to add specific actions for each intent.',
        default: [
          {
            name: 'Book a table',
            description: 'The user wants to reserve a dining spot.',
          },
        ],
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      intent: {
        type: 'string',
        examples: ['Small talk'],
      },
    },
  }

  async beforeUpdate(
    update: Partial<WorkflowAction>,
    prevWorkflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> {
    if (update.inputs?.intents) {
      // Trim names and descriptions
      update.inputs.intents = update.inputs.intents.map((intent) => ({
        ...intent,
        name: intent.name.trim(),
        description: intent.description?.trim(),
      }))

      // All intents must have a unique non-empty name
      const intentNames = update.inputs.intents.map((intent) => intent.name.toLowerCase().trim())
      if (intentNames.some((name) => !name)) {
        throw new Error('All intents must have a name.')
      }
      if (new Set(intentNames).size !== intentNames.length) {
        throw new Error('Intents cannot have duplicate names.')
      }
    }
    const intents: UserIntent[] = update.inputs?.intents ?? prevWorkflowAction.inputs?.intents ?? []

    if (update.nextActions) {
      // All next actions must have a unique non-empty condition, and all conditions must be an intent
      const conditions = update.nextActions.map((action) => action.condition)
      if (conditions.some((condition) => !condition)) {
        throw new Error('All next actions must have a condition.')
      }
      if (new Set(conditions).size !== conditions.length) {
        throw new Error('All next actions must have a unique condition.')
      }
    }
    let nextActions = update.nextActions ?? prevWorkflowAction.nextActions ?? []

    if (update.inputs?.intents) {
      const newIntents: UserIntent[] = update.inputs?.intents ?? []
      const oldIntents: UserIntent[] = prevWorkflowAction.inputs?.intents ?? []

      // Mapping of old intent names to new ones
      const nameMap: Record<string, string> = {}

      oldIntents.forEach((oldIntent, index) => {
        if (newIntents[index]) {
          nameMap[oldIntent.name] = newIntents[index].name
        }
      })

      // Update conditions based on changed intent names
      const newNextActions = nextActions.map((action) => {
        if (nameMap[action.condition!]) {
          return {
            ...action,
            condition: nameMap[action.condition!],
          }
        }
        return action
      })

      nextActions = newNextActions
    }

    if (nextActions.some((action) => !intents.some((intent) => intent.name === action.condition))) {
      throw new Error('All actions must be associated with a valid intent.')
    }

    // Reorder actions based on the order of intents
    const reorderedActions: WorkflowNextAction[] = intents
      .map((intent) => nextActions.find((action) => action.condition === intent.name))
      .filter((action): action is WorkflowNextAction => action !== undefined)
    update.nextActions = reorderedActions

    return update
  }

  async run({ inputs, previousOutputs }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.message?.trim()) {
      throw new BadRequestException(`Expected message to be defined`)
    }
    if (!Array.isArray(inputs.intents)) {
      throw new BadRequestException(`Expected intents to be an array`)
    }
    let intent: string | null
    if (inputs.intents.length) {
      const messages = (previousOutputs?.messages ?? [])
        .map((message) => ({
          content: message.content,
          role: message.from === 'user' ? 'user' : 'assistant',
        }))
        .slice(0, -1)
      intent = await getUserIntent(inputs.intents, inputs.message.trim(), messages)
    } else {
      intent = 'Other'
    }
    if (intent) {
      return {
        outputs: {
          intent,
        },
        condition: intent,
        credits: 5,
      }
    }
    throw new Error(`Failed to get user intent`)
  }
}
