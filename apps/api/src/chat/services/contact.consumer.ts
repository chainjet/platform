import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { Job } from 'bull'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { Integration } from '../../integrations/entities/integration'
import { IntegrationService } from '../../integrations/services/integration.service'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from '../../workflow-runs/services/workflow-run.service'
import { WorkflowTrigger } from '../../workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from '../../workflow-triggers/services/workflow-trigger.service'
import { WorkflowUsedIdService } from '../../workflow-triggers/services/workflow-used-id.service'
import { WorkflowService } from '../../workflows/services/workflow.service'

interface ContactAddedJob {
  type: 'contactAdded'
  contactId: string
  contactAddress: string
  ownerId: string
}

interface ContactsAddedJob {
  type: 'contactsAdded'
  contactIds: string[]
  contactAddresses: string[]
  ownerId: string
}

type ContactsJob = ContactAddedJob | ContactsAddedJob

@Processor('contacts')
export class ContactsConsumer {
  private readonly logger = new Logger(ContactsConsumer.name)

  private contactsIntegration: Integration
  private newContactIntegrationTrigger: IntegrationTrigger

  constructor(
    private integrationService: IntegrationService,
    private integrationTriggerService: IntegrationTriggerService,
    private workflowService: WorkflowService,
    private workflowTriggerService: WorkflowTriggerService,
    private workflowActionService: WorkflowActionService,
    private workflowRunService: WorkflowRunService,
    private workflowUsedIdService: WorkflowUsedIdService,
    private runnerService: RunnerService,
  ) {}

  async onModuleInit() {
    this.contactsIntegration = (await this.integrationService.findOne({ key: 'contacts' })) as Integration
    this.newContactIntegrationTrigger = (await this.integrationTriggerService.findOne({
      integration: this.contactsIntegration._id,
      key: 'newContactTrigger',
    })) as IntegrationTrigger
  }

  @Process()
  async onContactAdded(job: Job<ContactsJob>) {
    switch (job.data.type) {
      case 'contactAdded':
        return this.onContactAddedJob(job as Job<ContactAddedJob>)
      case 'contactsAdded':
        return this.onContactsAddedJob(job as Job<ContactsAddedJob>)
    }
  }

  async onContactAddedJob(job: Job<ContactAddedJob>) {
    // trigger contact created workflows
    const workflowTriggers = await this.workflowTriggerService.find({
      integrationTrigger: this.newContactIntegrationTrigger.id,
      enabled: true,
      planLimited: { $ne: true },
      owner: job.data.ownerId,
      // numberOfActions: { $gt: 0 },
    })
    for (const workflowTrigger of workflowTriggers) {
      await this.runContactAddedTrigger(workflowTrigger, job.data.contactId, job.data.contactAddress)
    }
  }

  async onContactsAddedJob(job: Job<ContactsAddedJob>) {
    const { contactIds, contactAddresses, ownerId } = job.data

    const workflowTriggers = await this.workflowTriggerService.find({
      integrationTrigger: this.newContactIntegrationTrigger.id,
      enabled: true,
      planLimited: { $ne: true },
      owner: ownerId,
      // numberOfActions: { $gt: 0 },
    })

    for (let i = 0; i < contactIds.length; i++) {
      for (const workflowTrigger of workflowTriggers) {
        await this.runContactAddedTrigger(workflowTrigger, contactIds[i], contactAddresses[i])
      }
    }
  }

  async runContactAddedTrigger(workflowTrigger: WorkflowTrigger, contactId: string, contactAddress: string) {
    try {
      await this.workflowUsedIdService.createOne({
        workflow: workflowTrigger.workflow,
        triggerId: contactId,
      })
    } catch (e) {
      this.logger.log(`Contact ${contactId} already processed`)
      return
    }
    const workflow = await this.workflowService.findById(workflowTrigger.workflow.toString())
    if (!workflow) {
      this.logger.log(`Workflow ${workflowTrigger.workflow} not found when resolving hook for contacts`)
      return
    }
    const hookTriggerOutputs = {
      id: contactId,
      outputs: {
        [workflowTrigger.id]: {},
        trigger: {},
        contact: {
          id: contactId,
          address: contactAddress,
        },
      },
    }
    const rootActions = await this.workflowActionService.find({
      workflow: workflowTrigger.workflow,
      isRootAction: true,
    })
    const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
      this.contactsIntegration,
      this.newContactIntegrationTrigger,
      workflow,
      workflowTrigger,
      rootActions.length > 0,
    )
    // await this.workflowTriggerService.updateById(workflowTrigger._id, {
    //   lastId: message.id,
    //   lastItem: message,
    // })
    void this.runnerService.runWorkflowActions(rootActions, [hookTriggerOutputs], workflowRun)
  }
}
