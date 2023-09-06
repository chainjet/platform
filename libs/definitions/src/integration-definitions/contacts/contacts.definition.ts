import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { AddTagContactAction } from './actions/add-tag-contact.action'
import { CreateContactAction } from './actions/create-contact.action'
import { FindContactAction } from './actions/find-contact.action'
import { RemoveTagContactAction } from './actions/remove-tag-contact.action'
import { UpdateContactAction } from './actions/update-contact.action'
import { ContactTaggedTrigger } from './triggers/contact-tagged.trigger'
import { NewContactTrigger } from './triggers/new-contact.trigger'

export class ContactsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'contacts'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewContactTrigger(), new ContactTaggedTrigger()]
  actions = [
    new CreateContactAction(),
    new AddTagContactAction(),
    new RemoveTagContactAction(),
    new FindContactAction(),
    new UpdateContactAction(),
  ]
}
