import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export class DistributePoapAction extends OperationOffChain {
  key = 'distributePoap'
  name = 'Distribute POAP Links'
  description = 'Distribute a list of POAP mint links'
  version = '1.0.0'
  skipAuth = false

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Address to generate a link for',
        type: 'string',
        description:
          'Enter the address for which the POAP mint link will be generated. Once a link is generated, no other address will receive the same link. But if a link is re-generated for the same address, it will always receive the same link.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      link: {
        type: 'string',
      },
    },
  }

  async run({ inputs, workflowOperation, accountCredential }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.address || !isAddress(inputs.address)) {
      throw new BadRequestException(`A valid address is required to generate a POAP link`)
    }
    const links = accountCredential?.fields?.links
    if (!Array.isArray(links) || !links.length) {
      throw new BadRequestException(`A list of mint links must be provided in order generate links for the address`)
    }
    if (!workflowOperation) {
      throw new InternalServerErrorException(`Workflow Action is required for POAP mint links`)
    }
    const store = workflowOperation.store ? { ...workflowOperation.store } : {}
    const entries = Object.entries(store)
    const linkForAddress = entries.find(([, address]) => address.toLowerCase() === inputs.address.toLowerCase())
    if (linkForAddress) {
      return {
        outputs: {
          link: linkForAddress[0],
        },
      }
    }
    const unusedLink = links.find((link) => !store[link])
    store[unusedLink] = inputs.address

    return {
      outputs: {
        link: unusedLink,
      },
      store,
    }
  }
}
