import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { HttpRequestAction } from './actions/http-request.action'

export class HttpDefinition extends SingleIntegrationDefinition {
  integrationKey = 'http'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new HttpRequestAction()]
}
