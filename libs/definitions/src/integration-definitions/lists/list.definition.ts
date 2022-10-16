import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { SortListAction } from './actions/sort-list'

export class ListsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'lists'
  integrationVersion = '1'
  schemaUrl = null

  actions = [new SortListAction()]
}
