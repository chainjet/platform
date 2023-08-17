import { BaseResolver } from '@app/common/base/base.resolver'
import { BadRequestException, NotFoundException, UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, ArgsType, Field, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { Filter } from '@ptc-org/nestjs-query-core'
import {
  Authorizer,
  AuthorizerInterceptor,
  ConnectionType,
  FilterableField,
  InjectAuthorizer,
  QueryArgsType,
} from '@ptc-org/nestjs-query-graphql'
import { GraphQLID, GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { ObjectId } from 'mongodb'
import { Types } from 'mongoose'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { CompilerService } from '../../compiler/compiler.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { CreateWorkflowInput, UpdateWorkflowInput, Workflow } from '../entities/workflow'
import { WorkflowService } from '../services/workflow.service'

@ObjectType('CompileWorkflow')
export class CompileWorkflowDto {
  @Field(() => GraphQLString)
  bytecode: string

  @Field(() => [GraphQLJSONObject])
  abi: object[]

  @Field(() => GraphQLString)
  sourcecode: string
}

@ArgsType()
export class WorkflowQuery extends QueryArgsType(Workflow) {}
export const WorkflowConnection = WorkflowQuery.ConnectionType

@ObjectType()
class Template extends Workflow {
  @FilterableField(() => GraphQLString, { nullable: true })
  integrationKey?: string
}

@ArgsType()
export class TemplateQuery extends QueryArgsType(Template) {}

@Resolver(() => Workflow)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Workflow))
export class WorkflowResolver extends BaseResolver(Workflow, {
  CreateDTOClass: CreateWorkflowInput,
  UpdateDTOClass: UpdateWorkflowInput,
  guards: [GraphqlGuard],
  enableTotalCount: true,
}) {
  constructor(
    protected workflowService: WorkflowService,
    @InjectAuthorizer(Workflow) readonly authorizer: Authorizer<Workflow>,
    protected compilerService: CompilerService,
    protected integrationService: IntegrationService,
  ) {
    super(workflowService)
  }

  @Query(() => CompileWorkflowDto)
  @UseGuards(GraphqlGuard)
  async compileWorkflow(
    @UserId() userId: Types.ObjectId,
    @Args({ name: 'workflowId', type: () => GraphQLID }) workflowId: string,
  ): Promise<CompileWorkflowDto> {
    const workflow = await this.workflowService.findById(workflowId)
    if (!workflow || workflow.owner.toString() !== userId.toString()) {
      throw new NotFoundException('Workflow not found')
    }

    if (!workflow.network) {
      throw new BadRequestException('Workflow network not found')
    }

    return await this.compilerService.compile(workflow)
  }

  @Query(() => WorkflowConnection)
  @UseGuards(GraphqlGuard)
  async recommendedTemplates(
    @UserId() userId: Types.ObjectId,
    @Args() query: TemplateQuery,
  ): Promise<ConnectionType<Workflow>> {
    let integrationId: ObjectId | undefined
    if (query.filter?.integrationKey) {
      const integrationKey = query.filter?.integrationKey?.eq
      delete query.filter?.integrationKey
      const integration = await this.integrationService.findOne({ key: integrationKey })
      if (!integration) {
        throw new NotFoundException('Integration not found')
      }
      integrationId = integration._id
    }

    const filter: Filter<Workflow> = {
      ...query.filter,
      ...{ isListed: { is: true }, isPublic: { is: true } },
      ...(integrationId ? ({ usedIntegrations: { eq: integrationId } } as Filter<Workflow>) : {}),
    }
    return WorkflowConnection.createFromPromise((q) => this.service.query(q), { ...query, ...{ filter } })
  }

  @Mutation(() => Workflow)
  async forkWorkflow(
    @UserId() userId: Types.ObjectId,
    @Args({ name: 'workflowId', type: () => GraphQLID }) workflowId: string,
    @Args({ name: 'templateInputs', type: () => GraphQLJSONObject, nullable: true })
    templateInputs: Record<string, any> = {},
    @Args({ name: 'credentialIds', type: () => GraphQLJSONObject, nullable: true })
    credentialIds: Record<string, string> = {},
  ) {
    const workflow = await this.workflowService.findByIdWithReadPermissions(workflowId, userId.toString())
    if (!workflow) {
      throw new NotFoundException('Workflow not found')
    }
    return await this.workflowService.fork(workflow, userId.toString(), templateInputs, credentialIds)
  }
}
