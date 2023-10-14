import { BaseIntegrationDefinition } from '@app/definitions/base-integration.definition'
import { NewCollectionCreatedTrigger } from './triggers/new-collection-created.trigger'
import { NewMintTrigger } from './triggers/new-mint.trigger'

export class ZoraDefinition extends BaseIntegrationDefinition {
  integrationKey = 'zora'
  integrationVersion = '1'
  title = 'Zora'
  logo = 'https://raw.githubusercontent.com/chainjet/assets/master/dapps/zora.co.png'
  categories = ['popular']

  triggers = [new NewCollectionCreatedTrigger(), new NewMintTrigger()]
  actions = []
}
