import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { Observable } from 'rxjs'
import { RunResponse } from './definition'
import { Operation } from './operation'
import { OperationType } from './types/OperationType'

export abstract class OperationTrigger extends Operation {
  type = OperationType.OffChain

  abstract idKey: string
  triggerPopulate?: {
    operationId: string
    inputs: Record<string, string>
  }
  triggerInstant?: boolean
  triggerHook?: boolean
  triggerHookInstructions?: string

  abstract run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> | null
}
