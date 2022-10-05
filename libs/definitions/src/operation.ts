import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { Observable } from 'rxjs'
import { RunResponse } from './definition'
import { OperationType } from './types/OperationType'

export abstract class Operation {
  abstract type: OperationType
  abstract key: string
  abstract name: string
  abstract description: string
  abstract version: string
  abstract inputs: JSONSchema7
  outputs: JSONSchema7 = {}
  deprecated = false
  skipAuth = false
  learnResponseIntegration = false
  learnResponseWorkflow = false
  metadata: object

  abstract run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> | null
}
