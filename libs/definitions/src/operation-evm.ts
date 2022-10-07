import { Operation } from './operation'
import { OperationType } from './types/OperationType'

export enum MutabilityEvm {
  Modify = '',
  View = 'view',
  Pure = 'pure',
}

export type ArgsEvm = Array<{ type: string; name: string }>

export type TemplateEvm = {
  code: string
  imports: string[]
  mutability: MutabilityEvm
  args: ArgsEvm
}

export abstract class OperationEvm extends Operation {
  type = OperationType.EVM

  abstract template(inputs: Record<string, any>): TemplateEvm
}
