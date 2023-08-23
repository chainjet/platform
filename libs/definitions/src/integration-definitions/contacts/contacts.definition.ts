import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { AddTagContactAction } from './actions/add-tag-contact.action'
import { CreateContactAction } from './actions/create-contact.action copy'
import { RemoveTagContactAction } from './actions/remove-tag-contact.action'
import { NewContactTrigger } from './triggers/new-contact.trigger'

export class ContactsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'contacts'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewContactTrigger()]
  actions = [new CreateContactAction(), new AddTagContactAction(), new RemoveTagContactAction()]
}
