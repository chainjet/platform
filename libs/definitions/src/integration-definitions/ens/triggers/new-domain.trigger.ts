import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewDomainTrigger extends OperationTrigger {
  idKey = 'items[].name'
  key = 'newDomain'
  name = 'New Domain Matching Filters'
  description = 'Triggers when a new domain matches the specified filters'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    type: 'object',
    required: [],
    properties: {
      ownedBy: {
        title: 'Owned by',
        type: 'string',
        description: 'Only domains owned by this address',
      },
      expiresInMoreThan: {
        title: 'Expires in more than (days)',
        type: 'number',
        description: 'Only domains that expire in more than this number of days',
        default: 7,
      },
      expiresInLessThan: {
        title: 'Expires in less than (days)',
        type: 'number',
        description: 'Only domains that expire in less than this number of days',
        default: 0,
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
      owner: {
        title: 'Owner',
        type: 'string',
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse | null> {
    const dateBefore = new Date()
    dateBefore.setDate(dateBefore.getDate() - (inputs.expiresInLessThan ?? 0))
    const timeBefore = Math.round(dateBefore.getTime() / 1000)
    const daysAfter = new Date()
    daysAfter.setDate(daysAfter.getDate() + (inputs.expiresInMoreThan ?? 0))
    const timeAfter = Math.round(daysAfter.getTime() / 1000)
    const query = `
    {
      registrations(
        where: {
          ${inputs.ownedBy ? `domain_: { owner: "${inputs.ownedBy.toLowerCase()}" },` : ''}
          expiryDate_gt: ${timeBefore},
          expiryDate_lt: ${timeAfter}
        },
        orderBy: expiryDate,
        orderDirection: desc
      ) {
        domain {
          name
          owner {
            id
          }
        }
        expiryDate
      }
    }
    `
    const res = await sendGraphqlQuery('https://api.thegraph.com/subgraphs/name/ensdomains/ens', query)
    return {
      outputs: {
        items: res.data.registrations.map((item: any) => ({
          name: item.domain.name,
          expiryDate: new Date(item.expiryDate * 1000).toISOString(),
          owner: item.domain.owner.id,
        })),
      },
    }
  }
}
