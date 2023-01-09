import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class DomainExpiresTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'domainExpires'
  name = 'Domain Expires'
  description = 'Triggers when a domain is about to expire'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    type: 'object',
    required: ['name', 'daysBefore'],
    properties: {
      name: {
        title: 'ENS name',
        type: 'string',
        examples: ['vitalik.eth'],
      },
      daysBefore: {
        title: 'Days before expiry to trigger',
        type: 'number',
        description: 'How many days before the domain expires to trigger the workflow.',
        default: 1,
      },
    },
  }
  outputs: JSONSchema7 = {
    type: 'object',
    properties: {
      name: {
        title: 'ENS name',
        type: 'string',
      },
      expiryDate: {
        title: 'Expiry date',
        type: 'string',
      },
    },
  }

  private async getNextCheck(name: string, daysBefore: number): Promise<Date> {
    const query = `
    {
      registrations(where: { domain_: { name: "${name}" }}) {
        expiryDate
      }
    }
    `
    const res = await sendGraphqlQuery('https://api.thegraph.com/subgraphs/name/ensdomains/ens', query)
    if (res.errors) {
      throw new Error(res.errors[0].message)
    }
    return new Date(res.data.registrations[0].expiryDate * 1000 - daysBefore * 24 * 60 * 60 * 1000)
  }

  async beforeCreate(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    workflowTrigger.inputs = workflowTrigger.inputs ?? {}
    if (!workflowTrigger.inputs.name) {
      throw new Error('ENS name is required')
    }
    if (!workflowTrigger.inputs.name.endsWith('.eth')) {
      workflowTrigger.inputs.name = workflowTrigger.inputs.name + '.eth'
    }
    workflowTrigger.nextCheck = await this.getNextCheck(
      workflowTrigger.inputs.name,
      workflowTrigger.inputs.daysBefore ?? 0,
    )
    workflowTrigger.name = `${workflowTrigger.inputs.name} expires`
    return workflowTrigger
  }

  async beforeUpdate(
    update: Partial<WorkflowTrigger>,
    prevWorkflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    const inputs = update.inputs ?? prevWorkflowTrigger.inputs
    if (!inputs?.name) {
      return update
    }
    if (!inputs.name.endsWith('.eth')) {
      inputs.name = inputs.name + '.eth'
    }
    update.nextCheck = await this.getNextCheck(inputs.name, inputs.daysBefore ?? 0)
    return update
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse | null> {
    if (!inputs.name) {
      throw new Error('ENS name is required')
    }
    const nextCheck = await this.getNextCheck(inputs.name, inputs.daysBefore ?? 0)
    if (nextCheck > new Date()) {
      return {
        outputs: {
          items: [],
        },
        nextCheck,
      }
    }
    const expiryDate = new Date(nextCheck.getTime() + (inputs.daysBefore ?? 0) * 24 * 60 * 60 * 1000)
    return {
      outputs: {
        items: [
          {
            id: Date.now(),
            name: inputs.name,
            expiryDate: expiryDate.toISOString(),
          },
        ],
      },
      nextCheck: null,
    }
  }
}
