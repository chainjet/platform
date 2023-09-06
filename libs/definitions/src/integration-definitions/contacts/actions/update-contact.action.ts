import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { ContactService } from 'apps/api/src/chat/services/contact.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export class UpdateContactAction extends OperationOffChain {
  key = 'updateContact'
  name = 'Update Contact Info'
  description = 'Attach data to a specific contact'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address', 'fields'],
    properties: {
      address: {
        title: 'Wallet Address',
        type: 'string',
        'x-if:chatbot': {
          'x-ui:widget': 'hidden',
          default: '{{contact.address}}',
        },
      } as JSONSchema7Definition,
      fields: {
        title: 'Contact Data',
        type: 'object',
        description: 'Key-Value data fields to attach to the contact',
        additionalProperties: true,
        default: {
          Name: '',
        },
        'x-addLabel': 'Add Field',
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    properties: {},
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!isAddress(inputs.address)) {
      throw new AuthenticationError('Invalid address')
    }
    if (!inputs.fields || typeof inputs.fields !== 'object') {
      throw new AuthenticationError('Invalid contact fields')
    }
    const contact = await ContactService.instance.findOne({ address: inputs.address, owner: user!.id })
    if (!contact) {
      throw new AuthenticationError('Contact not found')
    }
    await ContactService.instance.updateOne(contact.id, { fields: inputs.fields })
    return {
      outputs: {},
    }
  }
}
