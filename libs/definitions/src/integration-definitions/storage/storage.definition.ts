import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { ReadStorageAction } from './actions/read-storage.action'
import { WriteStorageAction } from './actions/write-storage.action'

export class StorageDefinition extends SingleIntegrationDefinition {
  integrationKey = 'storage'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new ReadStorageAction(), new WriteStorageAction()]
}
