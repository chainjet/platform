import { BaseIntegrationDefinition } from '@app/definitions/base-integration.definition'
import { GraphQLRequestAction } from './actions/graphql-request.action'
import { NewItemInGraphqlQueryTrigger } from './trigger/new-item-in-graphql-query.trigger'

export class GraphqlDefinition extends BaseIntegrationDefinition {
  title = 'GraphQL'
  logo = 'https://raw.githubusercontent.com/chainjet/assets/master/integrations/graphql.svg'
  integrationKey = 'graphql'
  integrationVersion = '1'
  categories = ['popular', 'chainjet']

  triggers = [new NewItemInGraphqlQueryTrigger()]
  actions = [new GraphQLRequestAction()]
}
