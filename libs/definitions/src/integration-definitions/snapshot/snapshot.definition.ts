import { IntegrationHookInjects } from '@app/definitions/definition'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { Logger, UnauthorizedException } from '@nestjs/common'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { Integration } from 'apps/api/src/integrations/entities/integration'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import { ProposalCreated } from './triggers/proposal-created.trigger'
import { ProposalDeleted } from './triggers/proposal-deleted.trigger'
import { ProposalEnded } from './triggers/proposal-ended.trigger'
import { ProposalStarted } from './triggers/proposal-started.trigger'

export class SnapshotDefinition extends SingleIntegrationDefinition {
  protected readonly logger = new Logger(SnapshotDefinition.name)

  integrationKey = 'snapshot'
  integrationVersion = '1'

  proposalCreatedTrigger = new ProposalCreated()
  proposalStartedTrigger = new ProposalStarted()
  proposalEndedTrigger = new ProposalEnded()
  proposalDeletedTrigger = new ProposalDeleted()

  triggers = [
    this.proposalCreatedTrigger,
    this.proposalStartedTrigger,
    this.proposalEndedTrigger,
    this.proposalDeletedTrigger,
  ]
  actions = []

  async onHookReceived(
    req: Request<ParamsDictionary, any, any, ParsedQs>,
    integration: Integration,
    { integrationTriggerService, workflowTriggerService }: IntegrationHookInjects,
  ): Promise<{
    response: any
    runs: { workflowTrigger: WorkflowTrigger; integrationTrigger: IntegrationTrigger; outputs: Record<string, any> }[]
  }> {
    if (req.headers.authentication !== process.env.SNAPSHOT_AUTHENTICATION_KEY) {
      this.logger.error(`Received proposal with invalid authentication key ${req.headers.authentication}`)
      throw new UnauthorizedException(`Invalid authentication key`)
    }

    const proposalId = req.body.id?.split('/')[1]
    if (!proposalId || !proposalId.startsWith('0x')) {
      this.logger.error(`Received proposal with invalid id ${proposalId}`)
      throw new Error(`Invalid proposal id ${proposalId}`)
    }
    if (!req.body.space) {
      this.logger.error(`Received proposal without space ${proposalId}`)
      throw new Error(`Space is required`)
    }

    let key: string | null = null
    switch (req.body.event) {
      case 'proposal/created':
        key = this.proposalCreatedTrigger.key
        break
      case 'proposal/start':
        key = this.proposalStartedTrigger.key
        break
      case 'proposal/end':
        key = this.proposalEndedTrigger.key
        break
      case 'proposal/deleted':
        key = this.proposalDeletedTrigger.key
        break
    }
    if (!key) {
      this.logger.error(`Received proposal with invalid event ${req.body.event}`)
      throw new Error(`Unknown snapshot event ${req.body.event}`)
    }

    const integrationTrigger = await integrationTriggerService.findOne({ key })
    if (!integrationTrigger) {
      this.logger.error(`Integration trigger with key ${key} not found for proposal ${proposalId}`)
      throw new Error(`Integration trigger ${key} not found`)
    }

    // TODO find only triggers for the space using an indexed field
    let workflowTriggers = await workflowTriggerService.find({
      integrationTrigger: integrationTrigger._id,
      enabled: true,
    })
    workflowTriggers = workflowTriggers.filter(
      (workflowTrigger) => workflowTrigger.inputs?.space?.toLowerCase() === req.body.space?.toLowerCase(),
    )

    if (!workflowTriggers.length) {
      return {
        response: {},
        runs: [],
      }
    }

    this.logger.log(`Found ${workflowTriggers.length} workflow triggers for ${key} on snapshot space ${req.body.space}`)

    let proposal: Record<string, any> = {}
    if (key !== this.proposalDeletedTrigger.key) {
      const url = `https://api.apireum.com/v1/snapshot/proposal/${proposalId}?key=${process.env.APIREUM_API_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      proposal = data?.proposal ?? {}
    }

    return {
      response: {},
      runs: workflowTriggers.map((workflowTrigger) => ({
        workflowTrigger,
        integrationTrigger,
        outputs: {
          ...proposal,
          id: req.body.id,
          space: req.body.space,
          expire: req.body.expire,
        },
      })),
    }
  }
}
