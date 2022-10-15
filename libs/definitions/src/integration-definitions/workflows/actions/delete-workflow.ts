import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class DeleteWorkflowAction extends OperationOffChain {
  key = 'deleteWorkflow'
  name = 'Delete Workflow'
  description = 'Delete a ChainJet Workflow'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['workflowId'],
    properties: {
      workflowId: {
        title: 'Workflow ID',
        type: 'string',
      },
    },
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!user?.id) {
      throw new Error('User is required')
    }
    const workflow = await WorkflowService.instance.findById(inputs.workflowId)
    if (!workflow || workflow.owner.toString() !== user.id.toString()) {
      throw new Error(`Workflow ${inputs.workflowId} not found`)
    }
    await WorkflowService.instance.deleteOne(workflow.id)
    return { outputs: {} }
  }
}
