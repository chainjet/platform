import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { GraphQLRequestAction } from './actions/graphql-request.action'

export class GraphqlDefinition extends SingleIntegrationDefinition {
  integrationKey = 'graphql'
  integrationVersion = '1'
  schemaUrl = null

  actions = [new GraphQLRequestAction()]
}
