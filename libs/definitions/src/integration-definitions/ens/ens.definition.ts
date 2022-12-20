import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { ListEnsDomainsAction } from './actions/list-ens-domains.trigger'
import { DomainExpiresTrigger } from './triggers/domain-expires.trigger'

export class EnsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'ens'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new DomainExpiresTrigger()]
  actions = [new ListEnsDomainsAction()]
}
