import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { AssertionsAction } from './actions/assertions.action'
import { DecisionAction } from './actions/decision.action'

export class LogicDefinition extends SingleIntegrationDefinition {
  readonly integrationKey = 'logic'
  readonly integrationVersion = '1'
  readonly schemaUrl = null

  actions = [new DecisionAction(), new AssertionsAction()]
}
