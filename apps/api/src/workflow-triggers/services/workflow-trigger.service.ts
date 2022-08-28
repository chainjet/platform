import { BaseService } from '@app/common/base/base.service'
import { IntegrationDefinitionFactory } from '@app/definitions'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { mongoose, ReturnModelType } from '@typegoose/typegoose'
import cronParser from 'cron-parser'
import _ from 'lodash'
import { InjectModel } from 'nestjs-typegoose'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { isValidDate, parseTime } from '../../../../../libs/common/src/utils/date.utils'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { capitalize } from '../../../../../libs/common/src/utils/string.utils'
import { assertNever } from '../../../../../libs/common/src/utils/typescript.utils'
import { AccountCredential } from '../../account-credentials/entities/account-credential'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { TriggerSchedule } from '../entities/trigger-schedule'
import { WorkflowTrigger } from '../entities/workflow-trigger'

@Injectable()
export class WorkflowTriggerService extends BaseService<WorkflowTrigger> {
  protected readonly logger = new Logger(WorkflowTriggerService.name)

  constructor(
    @InjectModel(WorkflowTrigger) protected readonly model: ReturnModelType<typeof WorkflowTrigger>,
    protected workflowService: WorkflowService,
    protected accountCredentialService: AccountCredentialService,
    protected integrationService: IntegrationService,
    protected integrationTriggerService: IntegrationTriggerService,
    protected integrationDefinitionFactory: IntegrationDefinitionFactory,
  ) {
    super(model)
  }

  async createOne(record: DeepPartial<WorkflowTrigger>): Promise<WorkflowTrigger> {
    if (!record.owner || !record.workflow || !record.integrationTrigger) {
      throw new BadRequestException()
    }

    // Verify workflow exist and the user has access to it
    const workflow = await this.workflowService.findById(record.workflow?.toString())
    if (!workflow?.owner || workflow.owner.toString() !== record.owner.toString()) {
      throw new NotFoundException(`Workflow ${record.workflow} not found`)
    }

    // Verify credentials exists and the user has access to it
    let accountCredential: AccountCredential | null = null
    if (record.credentials) {
      accountCredential = (await this.accountCredentialService.findById(record.credentials.toString())) ?? null
      if (!accountCredential?.owner || accountCredential.owner.toString() !== record.owner.toString()) {
        throw new NotFoundException(`Account credentials ${record.credentials} not found`)
      }
    }

    // Verify integration trigger exists
    const integrationTrigger = await this.integrationTriggerService.findById(record.integrationTrigger.toString())
    if (!integrationTrigger) {
      throw new NotFoundException(`Integration trigger ${record.integrationTrigger} not found`)
    }

    const integration = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationTrigger.integration} not found`)
    }

    if (integrationTrigger.isWebhook) {
      record.hookId = SecurityUtils.generateRandomString(48)
    }

    record.name = capitalize(integrationTrigger.name)

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const workflowTrigger = await definition.beforeCreateWorkflowTrigger(record, integrationTrigger, accountCredential)
    const createdEntity = await super.createOne(workflowTrigger)
    await definition.afterCreateWorkflowTrigger(createdEntity, integrationTrigger, accountCredential, (data) =>
      super.updateOne(createdEntity.id, data),
    )
    return createdEntity
  }

  async updateOne(
    id: string,
    update: DeepPartial<WorkflowTrigger>,
    opts?: UpdateOneOptions<WorkflowTrigger>,
  ): Promise<WorkflowTrigger> {
    const workflowTrigger = await this.findById(id, opts)
    if (!workflowTrigger) {
      throw new NotFoundException('Worflow trigger not found')
    }

    // If frequency was updated or workflow was enabled update nextCheck
    const scheduleUpdated = update.schedule && !_.isEqual(update.schedule, workflowTrigger.schedule ?? {})
    const workflowEnabled = update.enabled && !workflowTrigger.enabled
    if (scheduleUpdated || workflowEnabled) {
      if (scheduleUpdated) {
        workflowTrigger.schedule = update.schedule as TriggerSchedule
      }
      if (workflowEnabled) {
        workflowTrigger.enabled = true
      }
      update.nextCheck = this.getTriggerNextCheck(workflowTrigger, true)
    }

    // Restart workflow failures if workflow is reenabled
    if (workflowEnabled) {
      update.consecutiveWorkflowFails = 0
      this.logger.log(`Workflow ${workflowTrigger.workflow} was enabled`)
    }

    // If trigger is disabled, remove nextCheck
    if (update.enabled === false) {
      update.nextCheck = undefined
      if (workflowTrigger.enabled) {
        this.logger.log(`Workflow ${workflowTrigger.workflow} was disabled`)
      }
    }

    const integrationTrigger = await this.integrationTriggerService.findById(
      workflowTrigger.integrationTrigger.toString(),
    )
    if (!integrationTrigger) {
      throw new NotFoundException('Integration trigger not found')
    }

    const integration = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationTrigger.integration} not found`)
    }

    // Verify credentials exists and the user has access to it
    let accountCredential: AccountCredential | null = null
    let credentialsId = update.credentials?.toString() ?? workflowTrigger.credentials?.toString()
    if (credentialsId) {
      accountCredential = (await this.accountCredentialService.findById(credentialsId)) ?? null
      if (!accountCredential?.owner || accountCredential.owner.toString() !== workflowTrigger.owner.toString()) {
        accountCredential = null
        credentialsId = undefined
      }
    }

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const updatedWorkflowTrigger = await definition.beforeUpdateWorkflowTrigger(
      update,
      integrationTrigger,
      accountCredential,
    )
    const updatedEntity = await super.updateOne(id, updatedWorkflowTrigger, opts)
    await definition.afterUpdateWorkflowTrigger(updatedEntity, integrationTrigger, accountCredential, (data) =>
      super.updateOne(updatedEntity.id, data, opts),
    )
    return updatedEntity
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<WorkflowTrigger> | undefined): Promise<WorkflowTrigger> {
    const workflowTrigger = await this.findById(id, opts)
    if (!workflowTrigger) {
      throw new NotFoundException('Workflow trigger not found')
    }

    const integrationTrigger = await this.integrationTriggerService.findById(
      workflowTrigger.integrationTrigger.toString(),
    )
    if (!integrationTrigger) {
      return super.deleteOne(id, opts)
    }

    const integration = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integration) {
      return super.deleteOne(id, opts)
    }

    let accountCredential: AccountCredential | null = null
    if (workflowTrigger.credentials) {
      accountCredential = (await this.accountCredentialService.findById(workflowTrigger.credentials.toString())) ?? null
      // this check isn't needed, but doesn't hurt either
      if (accountCredential && accountCredential.owner.toString() !== workflowTrigger.owner.toString()) {
        throw new BadRequestException()
      }
    }

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    await definition.beforeDeleteWorkflowTrigger(workflowTrigger, integrationTrigger, accountCredential)
    const deletedEntity = super.deleteOne(id, opts)
    await definition.afterDeleteWorkflowTrigger(workflowTrigger, integrationTrigger, accountCredential)
    return deletedEntity
  }

  async updateNextCheck(workflowTrigger: WorkflowTrigger): Promise<void> {
    try {
      const nextCheck = this.getTriggerNextCheck(workflowTrigger)
      if (workflowTrigger.nextCheck !== nextCheck) {
        await this.updateOne(workflowTrigger.id, { nextCheck })
      }
    } catch (e) {
      this.logger.error(`Error updating nextCheck for ${workflowTrigger.id}: ${e.message}`)
    }
  }

  getTriggerNextCheck(workflowTrigger: WorkflowTrigger, scheduleChanged: boolean = false): Date | undefined {
    if (!workflowTrigger.enabled) {
      return
    }

    const schedule: TriggerSchedule | undefined = workflowTrigger.schedule
    if (!schedule?.frequency) {
      return
    }
    switch (schedule.frequency) {
      case 'once':
        const onceDate = new Date(schedule.date)
        if (!isValidDate(onceDate)) {
          throw new BadRequestException('Date is not valid')
        }
        return Date.now() < onceDate.getTime() ? onceDate : undefined

      case 'interval':
        const nextCheck = new Date((workflowTrigger.nextCheck?.getTime() ?? 0) + schedule.interval * 1000)
        if (scheduleChanged || Date.now() > nextCheck.getTime()) {
          return new Date(Date.now() + schedule.interval * 1000)
        }
        return nextCheck

      case 'hour':
        const hourDate = new Date(Date.now())
        if (hourDate.getMinutes() >= schedule.minute) {
          hourDate.setHours(hourDate.getHours() + 1)
        }
        hourDate.setMinutes(schedule.minute)
        return hourDate

      case 'day':
        const dayDate = new Date(Date.now())
        const [dayHours, dayMinutes] = parseTime(schedule.time)
        if (dayDate.getHours() > dayHours || (dayDate.getHours() === dayHours && dayDate.getMinutes() >= dayMinutes)) {
          dayDate.setDate(dayDate.getDate() + 1)
        }
        dayDate.setHours(dayHours)
        dayDate.setMinutes(dayMinutes)
        return dayDate

      case 'week':
        const weekDate = new Date(Date.now())
        const [weekHours, weekMinutes] = parseTime(schedule.time)
        const useNextWeek =
          weekDate.getDay() > schedule.dayOfWeek ||
          (weekDate.getDay() === schedule.dayOfWeek &&
            (weekDate.getHours() > weekHours ||
              (weekDate.getHours() === weekHours && weekDate.getMinutes() >= weekMinutes)))
        if (useNextWeek) {
          weekDate.setDate(weekDate.getDate() + 7)
        }
        weekDate.setDate(weekDate.getDate() + Math.abs(weekDate.getDay() - schedule.dayOfWeek))
        weekDate.setHours(weekHours)
        weekDate.setMinutes(weekMinutes)
        return weekDate

      case 'month':
        const monthDate = new Date(Date.now())
        const [monthHours, monthMinutes] = parseTime(schedule.time)
        const useNextMonth =
          monthDate.getDate() > schedule.dayOfMonth ||
          (monthDate.getDate() === schedule.dayOfMonth &&
            (monthDate.getHours() > monthHours ||
              (monthDate.getHours() === monthHours && monthDate.getMinutes() >= monthMinutes)))
        if (useNextMonth) {
          monthDate.setMonth(monthDate.getMonth() + 1)
        }
        monthDate.setDate(schedule.dayOfMonth)
        monthDate.setHours(monthHours)
        monthDate.setMinutes(monthMinutes)
        return monthDate

      case 'cron':
        try {
          return cronParser.parseExpression(`0 ${schedule.expression}`).next().toDate()
        } catch (e) {
          throw new BadRequestException(e.message)
        }

      default:
        assertNever(schedule)
    }
  }

  async incrementWorkflowRunFailures(workflowId: Reference<Workflow, mongoose.Types.ObjectId>): Promise<void> {
    const trigger = await this.findOne({ workflow: workflowId })
    if (trigger) {
      trigger.consecutiveWorkflowFails++
      const shouldDisableWorkflow =
        trigger.maxConsecutiveFailures && trigger.consecutiveWorkflowFails >= trigger.maxConsecutiveFailures
      await this.updateOne(trigger.id, {
        consecutiveWorkflowFails: trigger.consecutiveWorkflowFails,
        ...(shouldDisableWorkflow ? { enabled: false } : {}),
      })
      if (shouldDisableWorkflow) {
        this.logger.log(
          `Workflow ${workflowId} was disabled due to ${trigger.maxConsecutiveFailures} consecutive failures`,
        )
      }
    }
  }
}
