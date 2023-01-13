import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { blockchainConfigList } from '@blockchain/blockchain/blockchain.config'
import { GetNativeBalanceAction } from './actions/get-native-balance'
import { GetTokenBalanceAction } from './actions/get-token-balance'
import { ReadContractAction } from './actions/read-contract'
import { NewEventTrigger } from './triggers/new-event.trigger'
import { NewTransactionTrigger } from './triggers/new-transaction.trigger'

export class BlockchainDefinition extends SingleIntegrationDefinition {
  integrationKey = 'blockchain'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewEventTrigger(), new NewTransactionTrigger()]

  actions = [
    new GetTokenBalanceAction(),
    new ReadContractAction(),
    new GetNativeBalanceAction(),
    // new GetTokenBalanceEvmAction(),
    // new TransferTokensEvmAction(),
  ]

  parseError(e: any): string {
    let error = e.response?.text ?? e.response ?? e.message ?? ''
    const config = blockchainConfigList()
    for (const network of Object.values(config.networks)) {
      error = error.replaceAll(network.url, '<RPC>')
    }
    return error
  }
}
