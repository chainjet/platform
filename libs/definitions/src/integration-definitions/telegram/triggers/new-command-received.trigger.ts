import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { BadRequestException } from '@nestjs/common'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewCommandReceived extends OperationTrigger {
  idKey = ''
  key = 'newCommandReceived'
  name = 'New Command Received'
  description = 'Triggers when a specific command is sent on a chat.'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: ['command'],
    properties: {
      command: {
        title: 'Command',
        type: 'string',
        description: 'The command to listen for. Must start with /',
        examples: ['/token'],
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      messageId: {
        type: 'number',
      },
      params: {
        type: 'string',
      },
      text: {
        type: 'string',
      },
      chatId: {
        type: 'number',
      },
      topicId: {
        type: 'number',
      },
      from: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          username: {
            type: 'string',
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
          isBot: {
            type: 'boolean',
          },
          languageCode: {
            type: 'string',
          },
        },
      },
      date: {
        type: 'string',
        format: 'date-time',
      },
    },
  }

  beforeCreate(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    const { inputs } = workflowTrigger
    if (!inputs?.command.startsWith('/')) {
      throw new BadRequestException('The command must start with /')
    }
    return Promise.resolve(workflowTrigger)
  }

  async run({}: OperationRunOptions): Promise<RunResponse | null> {
    throw new Error('Cannot run an instant trigger')
  }
}
