import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { Observable } from 'rxjs'
import { RunResponse } from './definition'
import { Operation } from './operation'
import { OperationType } from './types/OperationType'

export abstract class OperationOffChain extends Operation {
  type = OperationType.OffChain

  abstract run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> | null
}
