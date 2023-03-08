import { BaseResolver } from '@app/common/base/base.resolver'
import { isObjectId } from '@app/common/utils/object.utils'
import { IntegrationDefinitionFactory } from '@app/definitions'
import { getInterpolatedVariables } from '@app/definitions/utils/field.utils'
import { NotFoundException, UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { OperationRunnerService } from 'apps/runner/src/services/operation-runner.service'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { parseStepInputs } from 'apps/runner/src/utils/input.utils'
import { GraphQLString } from 'graphql'
import { ObjectId } from 'mongoose'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { IntegrationActionService } from '../../integration-actions/services/integration-action.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { UserService } from '../../users/services/user.service'
import { WorkflowTriggerService } from '../../workflow-triggers/services/workflow-trigger.service'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { CreateWorkflowActionInput, UpdateWorkflowActionInput, WorkflowAction } from '../entities/workflow-action'
import { WorkflowActionService } from '../services/workflow-action.service'

@Resolver(() => WorkflowAction)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(WorkflowAction))
export class WorkflowActionResolver extends BaseResolver(WorkflowAction, {
  CreateDTOClass: CreateWorkflowActionInput,
  UpdateDTOClass: UpdateWorkflowActionInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected workflowActionService: WorkflowActionService,
    protected workflowTriggerService: WorkflowTriggerService,
    protected workflowService: WorkflowService,
    protected integrationService: IntegrationService,
    protected integrationActionService: IntegrationActionService,
    protected userService: UserService,
    protected operationRunnerService: OperationRunnerService,
    protected integrationDefinitionFactory: IntegrationDefinitionFactory,
    protected runnerService: RunnerService,
  ) {
    super(workflowActionService)
  }

  @Mutation(() => WorkflowAction)
  async testWorkflowAction(
    @UserId() userId: ObjectId,
    @Args('id', { type: () => GraphQLString }) id: string,
  ): Promise<WorkflowAction | null> {
    const action = await this.workflowActionService.findById(id)
    if (!action || action.owner.toString() !== userId.toString()) {
      return action ?? null
    }
    const interpolatedVars = getInterpolatedVariables(action.inputs ?? {})

    const previousOutputs: Record<string, any> = {}
    if (interpolatedVars.length) {
      const trigger = await this.workflowTriggerService.findOne({ workflow: action.workflow })
      if (trigger) {
        previousOutputs.trigger = trigger.lastItem ?? {}
        previousOutputs[trigger.id] = trigger.lastItem ?? {}
      }
      const ids = interpolatedVars
        .map((v) => v.split('.')[0])
        .filter((v) => isObjectId(v) && (!trigger || v !== trigger?.id))

      const actions = await this.workflowActionService.find({ workflow: action.workflow, _id: { $in: ids } })
      for (const a of actions) {
        previousOutputs[a.id] = a.lastItem ?? {}
      }
    }
    const inputs = parseStepInputs({ ...action.inputs }, previousOutputs)

    const integrationAction = await this.integrationActionService.findById(action.integrationAction.toString())
    if (!integrationAction) {
      throw new NotFoundException('Integration action not found')
    }
    const integration = await this.integrationService.findById(integrationAction.integration.toString())
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationAction.integration} not found`)
    }
    const workflow = await this.workflowService.findById(action.workflow.toString())
    if (!workflow) {
      throw new Error(`Workflow "${action.workflow}" not found`)
    }
    const user = (await this.userService.findById(userId.toString()))!

    const { credentials, accountCredential, integrationAccount } =
      await this.runnerService.getCredentialsAndIntegrationAccount(
        action.credentials?._id?.toString(),
        userId.toString(),
        () => {
          throw new NotFoundException('Account credential not found')
        },
      )

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    try {
      const runResponse = await this.operationRunnerService.runAction(definition, {
        integration,
        integrationAccount,
        inputs,
        credentials,
        accountCredential,
        user,
        operation: integrationAction,
        workflow,
        workflowOperation: action,
      })
      await this.workflowActionService.updateById(action._id, { lastItem: runResponse.outputs ?? {} })
    } catch (e) {
      let error = definition.parseError(e)
      if (!error || error.toString() === '[object Object]') {
        error = e.message
      }
      throw new Error(error)
    }
    return action
  }
}
