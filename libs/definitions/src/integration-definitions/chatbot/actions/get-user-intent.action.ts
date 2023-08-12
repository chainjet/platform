import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { getUserIntent } from '@chainjet/tools'
import { UserIntent } from '@chainjet/tools/dist/ai/ai.utils'
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
        'x-ui:widget': 'hidden',
        default: '{{message.content}}',
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
    if (update.nextActions) {
      if (update.nextActions.some((action) => !action.condition)) {
        throw new Error('All actions must have a condition.')
      }
      return update
    }

    const newIntents: UserIntent[] = update.inputs?.intents ?? []
    const oldIntents: UserIntent[] = prevWorkflowAction.inputs?.intents ?? []
    let nextActions = [...(prevWorkflowAction.nextActions ?? [])]

    // Check if there are any duplicate intent names
    const intentNames = newIntents.map((intent) => intent.name.toLowerCase().trim())
    const hasDuplicateNames = new Set(intentNames).size !== intentNames.length

    if (hasDuplicateNames) {
      throw new Error('Intents cannot have duplicate names.')
    }

    // Mapping of old intent names to new ones
    const nameMap: Record<string, string> = {}

    oldIntents.forEach((oldIntent, index) => {
      if (newIntents[index]) {
        nameMap[oldIntent.name] = newIntents[index].name
      }
    })

    // Update conditions based on changed intent names
    nextActions = nextActions.map((action) => {
      if (nameMap[action.condition!]) {
        return {
          ...action,
          condition: nameMap[action.condition!],
        }
      }
      return action
    })

    // Reorder actions based on the order of intents
    const reorderedActions: WorkflowNextAction[] = newIntents
      .map((intent) => {
        return nextActions.find((action) => action.condition === intent.name) || null
      })
      .filter((action): action is WorkflowNextAction => action !== null)

    update.nextActions = reorderedActions
    return update
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.message?.trim()) {
      throw new BadRequestException(`Expected message to be defined`)
    }
    if (!Array.isArray(inputs.intents)) {
      throw new BadRequestException(`Expected intents to be an array`)
    }
    let intent: string | null
    if (inputs.intents.length) {
      intent = await getUserIntent(inputs.intents, inputs.message.trim())
    } else {
      intent = 'Other'
    }
    if (intent) {
      return {
        outputs: {
          intent,
        },
        condition: intent,
      }
    }
    throw new Error(`Failed to get user intent`)
  }
}
