import { JSONSchema7 } from 'json-schema'
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
}
