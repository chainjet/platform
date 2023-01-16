import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { BadRequestException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import * as chrono from 'chrono-node'
import { JSONSchema7 } from 'json-schema'

export class SleepForAction extends OperationOffChain {
  key = 'sleepFor'
  name = 'Sleep For'
  description = 'Wait for a specific amount of time before running the next action.'
  version = '2.0.0'

  inputs: JSONSchema7 = {
    required: ['duration'],
    properties: {
      duration: {
        type: 'string',
        title: 'Duration',
        description: 'Time to wait before executing the next action.',
        default: '1 week',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      sleepUntil: {
        type: 'string',
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    if (/^\d/.test(inputs.duration)) {
      inputs.duration = `in ${inputs.duration}`
    }
    const sleepUntil = chrono.parseDate(inputs.duration)
    if (sleepUntil === null) {
      throw new BadRequestException('Invalid sleep duration')
    }
    return {
      outputs: {
        sleepUntil: sleepUntil.toISOString(),
      },
      sleepUntil,
    }
  }
}
