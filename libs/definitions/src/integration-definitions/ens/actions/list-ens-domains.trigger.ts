import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class ListEnsDomainsAction extends OperationOffChain {
  key = 'listEnsDomains'
  name = 'List ENS Domains'
  description = 'List the ENS domains for a given address'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        type: 'string',
        title: 'Address',
        description: 'Address to list ENS domains for',
      },
    },
  }
  outputs: JSONSchema7 = {
    type: 'object',
    properties: {
      domains: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            labelName: { type: 'string' },
            labelhash: { type: 'string' },
            parent: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
            subdomains: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            },
            subdomainCount: { type: 'integer' },
            resolvedAddress: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
            resolver: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                address: { type: 'string' },
              },
            },
            ttl: { type: 'integer' },
            isMigrated: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs?.address) {
      throw new Error('Address is required')
    }
    const query = `
    {
      domains(where: { owner: "${inputs.address.toLowerCase()}" }) {
        id
        name
        labelName
        labelhash
        parent {
          id
        }
        subdomains {
          id
          name
        }
        subdomainCount
        resolvedAddress {
          id
        }
        resolver {
          id
          address
        }
        ttl
        isMigrated
        createdAt
      }
    }
    `
    const res = await sendGraphqlQuery('https://api.thegraph.com/subgraphs/name/ensdomains/ens', query)
    if (res.errors) {
      throw new Error(res.errors[0].message)
    }
    return {
      outputs: {
        domains: res.data.domains,
      },
    }
  }
}
