import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { AddTagContactAction } from './actions/add-tag-contact.action'
import { RemoveTagContactAction } from './actions/remove-tag-contact.action'

export class ContactsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'contacts'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new AddTagContactAction(), new RemoveTagContactAction()]
}
