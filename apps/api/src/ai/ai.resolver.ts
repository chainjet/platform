import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  InternalServerErrorException,
  Logger,
  UseGuards,
} from '@nestjs/common'
import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql'
import axios from 'axios'
import { Cache } from 'cache-manager'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { ObjectId } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { AccountCredentialService } from '../account-credentials/services/account-credentials.service'
import { UserId } from '../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../auth/guards/graphql.guard'
import { IntegrationAccountService } from '../integration-accounts/services/integration-account.service'
import { IntegrationActionService } from '../integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from '../integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../integrations/services/integration.service'
import { UserService } from '../users/services/user.service'
import { WorkflowActionService } from '../workflow-actions/services/workflow-action.service'
import { WorkflowTriggerService } from '../workflow-triggers/services/workflow-trigger.service'
import { WorkflowService } from '../workflows/services/workflow.service'

@ObjectType()
class ActionSendPrompt {
  @Field()
  integrationId: string

  @Field()
  integrationName: string

  @Field({ nullable: true })
  integrationLogo?: string

  @Field()
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field(() => GraphQLJSONObject)
  inputs: Record<string, any>
}

@ObjectType()
class TriggerSendPrompt {
  @Field()
  integrationId: string

  @Field()
  integrationName: string

  @Field({ nullable: true })
  integrationLogo?: string

  @Field()
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field(() => GraphQLJSONObject)
  inputs: Record<string, any>

  @Field({ nullable: true })
  integrationAccountId?: string
}

@ObjectType()
export class SendPromptPayload {
  @Field()
  id: string

  @Field(() => TriggerSendPrompt)
  trigger: TriggerSendPrompt

  @Field(() => [ActionSendPrompt])
  actions: ActionSendPrompt[]
}

@ObjectType()
export class CreateWorkflowPlayload {
  @Field()
  id: string
}

@Resolver()
export class AiResolver {
  private readonly logger = new Logger(AiResolver.name)

  constructor(
    private userService: UserService,
    private integrationService: IntegrationService,
    private integrationTriggerService: IntegrationTriggerService,
    private integrationActionService: IntegrationActionService,
    private integrationAccountService: IntegrationAccountService,
    private workflowService: WorkflowService,
    private workflowTriggerService: WorkflowTriggerService,
    private workflowActionService: WorkflowActionService,
    private accountCredentialService: AccountCredentialService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @UseGuards(GraphqlGuard)
  @Mutation(() => SendPromptPayload)
  async sendPrompt(
    @UserId() userId: ObjectId,
    @Args({ name: 'prompt', type: () => GraphQLString }) prompt: string,
  ): Promise<SendPromptPayload> {
    if (!process.env.CHAINJET_AI_ENDPOINT) {
      throw new Error('Not supported')
    }
    this.logger.log(`Prompt by ${userId}: ${prompt}`)
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new BadRequestException(`User ${userId} not found`)
    }
    const res = await axios.post(process.env.CHAINJET_AI_ENDPOINT, {
      userAddress: user.address,
      prompt,
    })
    const data = res.data
    if (!data.trigger || !data.code) {
      throw new Error('Invalid response')
    }
    const triggerData = data.trigger as { integrationKey: string; triggerKey: string; inputs: Record<string, any> }
    const triggerIntegration = await this.integrationService.findOne({ key: triggerData.integrationKey })
    if (!triggerIntegration) {
      throw new BadRequestException(`Integration ${triggerData.integrationKey} not found`)
    }
    const integrationTrigger = await this.integrationTriggerService.findOne({
      integration: triggerIntegration._id,
      key: triggerData.triggerKey,
    })
    if (!integrationTrigger) {
      throw new BadRequestException(
        `Integration trigger ${triggerData.triggerKey} not found for integration ${triggerIntegration._id}`,
      )
    }

    const id = uuidv4()

    // save response for 6 hours
    await this.cacheManager.set(`ai:${userId}:${id}`, JSON.stringify(data), { ttl: 60 * 60 * 6 } as any)

    const actions: ActionSendPrompt[] = []
    for (const action of data.actions) {
      const actionData = action as {
        integrationKey: string
        actionKey: string
        params: string[]
        inputs: Record<string, any>
      }
      const actionIntegration = await this.integrationService.findOne({ key: actionData.integrationKey })
      if (!actionIntegration) {
        throw new BadRequestException(`Integration ${actionData.integrationKey} not found`)
      }
      const integrationAction = await this.integrationActionService.findOne({
        integration: actionIntegration._id,
        key: actionData.actionKey,
      })
      if (!integrationAction) {
        throw new BadRequestException(
          `Integration action ${actionData.actionKey} not found for integration ${actionIntegration._id}`,
        )
      }
      actions.push({
        integrationId: actionIntegration.id,
        integrationName: actionIntegration.name,
        integrationLogo: actionIntegration.logo,
        id: integrationAction.id,
        name: integrationAction.name,
        description: integrationAction.description,
        inputs: actionData.inputs,
      })
    }

    let triggerIntegrationAccountId: string | undefined
    if (triggerIntegration.integrationAccount) {
      const triggerIntegrationAccount = await this.integrationAccountService.findOne({
        _id: triggerIntegration.integrationAccount,
      })
      if (!triggerIntegrationAccount) {
        throw new InternalServerErrorException(`Integration account ${triggerIntegration.integrationAccount} not found`)
      }
      triggerIntegrationAccountId = triggerIntegrationAccount.id
    }

    return {
      id,
      trigger: {
        integrationId: triggerIntegration.id,
        integrationName: triggerIntegration.name,
        integrationLogo: triggerIntegration.logo,
        id: integrationTrigger.id,
        name: integrationTrigger.name,
        description: integrationTrigger.description,
        inputs: triggerData.inputs,
        integrationAccountId: triggerIntegrationAccountId,
      },
      actions,
    }
  }

  @UseGuards(GraphqlGuard)
  @Mutation(() => SendPromptPayload)
  async createWorkflowPrompt(
    @UserId() userId: ObjectId,
    @Args({ name: 'id', type: () => GraphQLString }) id: string,
    @Args({ name: 'credentialIds', type: () => GraphQLJSONObject }) credentialIds: Record<string, string>,
  ): Promise<CreateWorkflowPlayload> {
    const dataStr = await this.cacheManager.get(`ai:${userId}:${id}`)
    if (!dataStr) {
      throw new BadRequestException(`Unexpected error, please try again later`)
    }

    // verify credentials ownership
    const credentialIdsWithKey: Record<string, string> = {}
    for (const credentialId of Object.values(credentialIds)) {
      const accountCredential = await this.accountCredentialService.findOne({ _id: credentialId, owner: userId })
      if (!accountCredential) {
        throw new BadRequestException(`Credential ${credentialId} not found`)
      }
      const integrationAccount = await this.integrationAccountService.findOne({
        _id: accountCredential.integrationAccount,
      })
      if (!integrationAccount) {
        throw new InternalServerErrorException(`Integration account ${accountCredential.integrationAccount} not found`)
      }
      credentialIdsWithKey[integrationAccount.key] = credentialId
    }

    const data = JSON.parse(dataStr as string)
    const triggerData = data.trigger as { integrationKey: string; triggerKey: string; inputs: Record<string, any> }
    const triggerIntegration = await this.integrationService.findOne({ key: triggerData.integrationKey })
    if (!triggerIntegration) {
      throw new BadRequestException(`Integration ${triggerData.integrationKey} not found`)
    }
    const integrationTrigger = await this.integrationTriggerService.findOne({
      integration: triggerIntegration._id,
      key: triggerData.triggerKey,
    })
    if (!integrationTrigger) {
      throw new BadRequestException(
        `Integration trigger ${triggerData.triggerKey} not found for integration ${triggerIntegration._id}`,
      )
    }
    const workflow = await this.workflowService.createOne({
      owner: userId as any,
      name: 'Untitled Workflow',
    })
    const trigger = await this.workflowTriggerService.createOne({
      owner: userId as any,
      workflow: workflow._id,
      integrationTrigger: integrationTrigger._id,
      enabled: true,
      inputs: triggerData.inputs,
      credentials:
        triggerIntegration.integrationAccount &&
        (credentialIds[triggerIntegration.integrationAccount._id.toString()] as any),
      ...(integrationTrigger.instant ? {} : { schedule: { frequency: 'interval', interval: 900 } }),
    })
    const actionIntegration = await this.integrationService.findOne({ key: 'internal' })
    if (!actionIntegration) {
      throw new BadRequestException(`Integration internal not found`)
    }
    const integrationAction = await this.integrationActionService.findOne({
      integration: actionIntegration._id,
      key: 'runInternalCode',
    })
    if (!integrationAction) {
      throw new BadRequestException(
        `Integration action runInternalCode not found for integration ${actionIntegration._id}`,
      )
    }
    const action = await this.workflowActionService.createOne(
      {
        owner: userId as any,
        workflow: workflow._id,
        integrationAction: integrationAction._id,
        inputs: {
          code: data.code,
          actions: data.actions,
        },
        store: {
          credentialIds: credentialIdsWithKey,
        },
      },
      { allowInternal: true },
    )
    return {
      id: workflow.id,
    }
  }
}
