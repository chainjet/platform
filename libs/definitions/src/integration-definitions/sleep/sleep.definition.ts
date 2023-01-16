import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { SleepForAction } from './actions/sleep-for.action'

export class SleepDefinition extends SingleIntegrationDefinition {
  integrationKey = 'sleep'
  integrationVersion = '1'
  schemaUrl = null

  actions = [new SleepForAction()]
}
