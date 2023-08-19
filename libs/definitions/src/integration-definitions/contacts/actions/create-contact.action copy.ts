import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { ContactService } from 'apps/api/src/contacts/services/contact.service'
import { User } from 'apps/api/src/users/entities/user'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export class CreateContactAction extends OperationAction {
  key = 'createContact'
  name = 'Create Contact'
  description = 'Create a new contact on ChainJet'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address', 'tags'],
    properties: {
      address: {
        title: 'Wallet Address',
        type: 'string',
      },
      tags: {
        title: 'Tags',
        type: 'string',
        description: 'Tags to add to the contact. Separate multiple tags with a comma.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {},
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!isAddress(inputs.address)) {
      throw new AuthenticationError('Invalid address')
    }
    const tags: string[] = inputs?.tags?.split(',').map((tag: string) => tag.trim()) ?? []
    await ContactService.instance.addSingleContact(getAddress(inputs.address), user as User, tags)
    return {
      outputs: {},
    }
  }
}
