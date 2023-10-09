import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { GraphQLRequestAction } from './actions/graphql-request.action'
import { NewItemInGraphqlQueryTrigger } from './trigger/new-item-in-graphql-query.trigger'

export class GraphqlDefinition extends SingleIntegrationDefinition {
  integrationKey = 'graphql'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewItemInGraphqlQueryTrigger()]
  actions = [new GraphQLRequestAction()]
}
