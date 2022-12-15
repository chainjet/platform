import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { DomainExpiresTrigger } from './triggers/domain-expires.trigger'

export class EnsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'ens'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new DomainExpiresTrigger()]
  actions = []
}
