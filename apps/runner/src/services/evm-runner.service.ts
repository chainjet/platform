import { Definition, RunResponse } from '@app/definitions'
import { ChainJetRunnerService } from '@blockchain/blockchain/runner/chainjet-runner.service'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { OperationRunOptions } from './operation-runner.service'

@Injectable()
export class EvmRunnerService {
  private readonly logger = new Logger(EvmRunnerService.name)

  constructor(private chainJetRunnerService: ChainJetRunnerService) {}

  async run(definition: Definition, opts: OperationRunOptions): Promise<RunResponse> {
    const workflowAction = opts.workflowOperation as WorkflowAction
    if (!workflowAction || !workflowAction.isContractRootAction || !workflowAction.address) {
      return { outputs: {} }
    }
    if (!opts.inputs.network) {
      throw new BadRequestException('Missing network')
    }
    // TODO send arguments
    const tx = await this.chainJetRunnerService.runTask(opts.inputs.network, workflowAction.address, [])
    this.logger.log(`Running ${workflowAction.address} on chain ${opts.inputs.network} with tx ${tx.hash}`)
    const res = await tx.wait()

    // TODO return result and tx data
    return { outputs: {} }
  }
}
