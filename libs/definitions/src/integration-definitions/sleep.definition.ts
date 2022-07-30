import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { BadRequestException } from '@nestjs/common'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class SleepDefinition extends SingleIntegrationDefinition {
  integrationKey = 'sleep'
  integrationVersion = '1'
  schemaUrl = null

  async run (opts: OperationRunOptions): Promise<RunResponse> {
    switch (opts.operation.key) {
      case 'sleepFor':
        return await this.runSleepFor(opts)
    }
    throw new Error('Not implemented yet')
  }

  private async runSleepFor (opts: OperationRunOptions): Promise<RunResponse> {
    let secondsPerUnit: number
    switch (opts.inputs.unit) {
      case 'seconds':
        secondsPerUnit = 1
        break
      case 'minutes':
        secondsPerUnit = 60
        break
      case 'hours':
        secondsPerUnit = 3600
        break
      case 'days':
        secondsPerUnit = 86400
        break
      default:
        if (opts.inputs.unit) {
          throw new BadRequestException(`Unit ${opts.inputs.unit} is not supported.`)
        }
        throw new BadRequestException('Unit is required but not specified.')
    }
    return {
      outputs: {},
      sleepUntil: new Date(Date.now() + (opts.inputs.amount || 1) * secondsPerUnit * 1000)
    }
  }
}
