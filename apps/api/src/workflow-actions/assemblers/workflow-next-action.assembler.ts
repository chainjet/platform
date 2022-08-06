import { DefaultEntityAssembler } from '@app/common/base/base.resolver'
import { Assembler, Class } from '@ptc-org/nestjs-query-core'
import { ObjectId } from 'mongodb'
import { WorkflowNextAction } from '../entities/workflow-next-action'

/**
 * The default assembler uses plainToClass which
 */
@Assembler(WorkflowNextAction, WorkflowNextAction)
export class WorkflowNextActionAssembler extends DefaultEntityAssembler<WorkflowNextAction, WorkflowNextAction> {
  convert<T>(cls: Class<T>, obj: object): T {
    if ((obj as WorkflowNextAction).action instanceof ObjectId) {
      return obj as unknown as T
    }
    return super.convert(cls, obj)
  }
}
