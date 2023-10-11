import { BaseIntegrationDefinition } from '@app/definitions/base-integration.definition'
import { NewLiveStreamTrigger } from './trigger/new-live-stream.trigger'

export class UnlonelyDefinition extends BaseIntegrationDefinition {
  integrationKey = 'unlonely'
  integrationVersion = '1'
  title = 'Unlonely'
  logo = 'https://raw.githubusercontent.com/chainjet/assets/master/dapps/unlonely.app.png'

  triggers = [new NewLiveStreamTrigger()]
  actions = []
}
