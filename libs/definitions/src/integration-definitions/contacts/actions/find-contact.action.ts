import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { BadRequestException } from '@nestjs/common'
import { ContactService } from 'apps/api/src/chat/services/contact.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'
import { expressionsToQuery, LogicExpression } from '../../logic/logic.common'

export class FindContactAction extends OperationOffChain {
  key = 'findContact'
  name = 'Find a contact'
  description = 'Find a contact matching the given filters'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['filter'],
    properties: {
      filter: {
        title: 'Filter',
        $ref: '#/$defs/OrFilters',
      },
    },
    $defs: {
      Filter: {
        type: 'object',
        required: ['leftValue', 'comparator'],
        properties: {
          leftValue: {
            title: 'Field',
            type: 'string',
            enum: ['address', 'tags'],
            enumNames: ['Address', 'Tags'],
          },
        },
        allOf: [
          {
            if: {
              properties: {
                leftValue: { const: 'address' },
              },
            },
            then: {
              properties: {
                comparator: {
                  title: 'Comparator',
                  type: 'string',
                  oneOf: [
                    { title: 'Equals', const: '=' },
                    { title: 'Not Equal', const: '!=' },
                  ],
                  default: '=',
                },
                rightValue: { title: 'Value', type: 'string' },
              },
            },
          },
          {
            if: {
              properties: {
                leftValue: { const: 'tags' },
              },
            },
            then: {
              properties: {
                comparator: {
                  title: 'Comparator',
                  type: 'string',
                  oneOf: [
                    { title: 'Contains', const: 'contains' },
                    { title: 'Not Contain', const: '!contains' },
                  ],
                  default: 'contains',
                },
                rightValue: { title: 'Value', type: 'string' },
              },
            },
          },
        ],
      },
      AndFilters: {
        type: 'array',
        items: { $ref: '#/$defs/Filter' },
        minItems: 1,
        'x-addLabel': 'And',
      },
      OrFilters: {
        type: 'array',
        items: { $ref: '#/$defs/AndFilters' },
        minItems: 1,
        'x-addLabel': 'Or',
      },
    },
  } as JSONSchema7
  outputs: JSONSchema7 = {
    properties: {
      contact: {
        type: 'object',
        'x-type': 'contact',
      } as JSONSchema7,
    },
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!Array.isArray(inputs.filter)) {
      throw new BadRequestException('Invalid filter')
    }
    const orFilters = inputs.filter as LogicExpression[][]

    // validate filters
    for (const orFilter of orFilters) {
      for (const andFilter of orFilter) {
        if (!['address', 'tags'].includes(andFilter.leftValue)) {
          throw new BadRequestException(`Invalid filter left value: ${andFilter.leftValue}`)
        }
        if (andFilter.leftValue === 'address') {
          if (!isAddress(andFilter.rightValue)) {
            throw new BadRequestException('The address provided is invalid')
          }
          if (!['=', '!='].includes(andFilter.comparator)) {
            throw new BadRequestException(`Invalid address filter comparator: ${andFilter.comparator}`)
          }
        }
        if (andFilter.leftValue === 'tags') {
          if (!['contains', '!contains'].includes(andFilter.comparator)) {
            throw new BadRequestException(`Invalid tag filter comparator: ${andFilter.comparator}`)
          }
        }
      }
    }

    const query = expressionsToQuery(inputs.filter)
    const contact = await ContactService.instance.findOne({ ...query, owner: user })

    if (contact) {
      return {
        outputs: {
          contact: {
            address: contact.address,
            tags: contact.tags,
          },
        },
      }
    }
    return {
      outputs: {
        contact: {},
      },
    }
  }
}
