import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { ContactService } from 'apps/api/src/chat/services/contact.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { ObjectId } from 'mongodb'

export class AddTagContactAction extends OperationOffChain {
  key = 'addTagContact'
  name = 'Add a tag to a contact'
  description = 'Add one or more tags to a contact'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address', 'tags'],
    properties: {
      address: {
        title: 'Wallet Address',
        type: 'string',
        'x-if:chatbot': {
          'x-ui:widget': 'hidden',
          default: '{{contact.address}}',
        },
      } as JSONSchema7Definition,
      tags: {
        title: 'Tags',
        type: 'string',
        description: 'Tags to add to the contact. Separate multiple tags with a comma.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!isAddress(inputs.address)) {
      throw new AuthenticationError('Invalid address')
    }
    const tags: string[] = inputs?.tags?.split(',').map((tag: string) => tag.trim()) ?? []
    const updatedTags = await ContactService.instance.addTags(inputs.address, tags, new ObjectId(user!.id))
    return {
      outputs: {
        tags: updatedTags,
      },
    }
  }
}
