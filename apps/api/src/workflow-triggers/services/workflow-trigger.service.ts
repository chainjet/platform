import { BaseService } from '@app/common/base/base.service'
import { IntegrationDefinitionFactory } from '@app/definitions'
import { DeepPartial, UpdateOneOptions } from '@nestjs-query/core'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { mongoose, ReturnModelType } from '@typegoose/typegoose'
import cronParser from 'cron-parser'
import _ from 'lodash'
import { InjectModel } from 'nestjs-typegoose'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { isValidDate, parseTime } from '../../../../../libs/common/src/utils/date.utils'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { capitalize } from '../../../../../libs/common/src/utils/string.utils'
import { assertNever } from '../../../../../libs/common/src/utils/typescript.utils'
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
    if (record.credentials) {
      const credentials = await this.accountCredentialService.findById(record.credentials.toString())
      if (!credentials?.owner || credentials.owner.toString() !== record.owner.toString()) {
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
    const workflowTrigger = await definition.beforeCreateWorkflowTrigger(record, integrationTrigger)

    return await super.createOne(workflowTrigger)
  }

  async updateOne(
    id: string,
    update: DeepPartial<WorkflowTrigger>,
    opts?: UpdateOneOptions<WorkflowTrigger>,
  ): Promise<WorkflowTrigger> {
    const currentTrigger = await this.findById(id)
    if (!currentTrigger) {
      throw new NotFoundException('Worflow trigger not found')
    }

    // If frequency was updated or workflow was enabled update nextCheck
    const scheduleUpdated = update.schedule && !_.isEqual(update.schedule, currentTrigger.schedule ?? {})
    const workflowEnabled = update.enabled && !currentTrigger.enabled
    if (scheduleUpdated || workflowEnabled) {
      if (scheduleUpdated) {
        currentTrigger.schedule = update.schedule as TriggerSchedule
      }
      if (workflowEnabled) {
        currentTrigger.enabled = true
      }
      update.nextCheck = this.getTriggerNextCheck(currentTrigger, true)
    }

    // Restart workflow failures if workflow is reenabled
    if (workflowEnabled) {
      update.consecutiveWorkflowFails = 0
      this.logger.log(`Workflow ${currentTrigger.workflow} was enabled`)
    }

    // If trigger is disabled, remove nextCheck
    if (update.enabled === false) {
      update.nextCheck = undefined
      if (currentTrigger.enabled) {
        this.logger.log(`Workflow ${currentTrigger.workflow} was disabled`)
      }
    }

    const integrationTrigger = await this.integrationTriggerService.findById(
      currentTrigger.integrationTrigger.toString(),
    )
    if (!integrationTrigger) {
      throw new NotFoundException('Integration trigger not found')
    }

    const integration = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationTrigger.integration} not found`)
    }

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const updatedWorkflowTrigger = await definition.beforeUpdateWorkflowTrigger(update, integrationTrigger)

    return await super.updateOne(id, updatedWorkflowTrigger, opts)
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
