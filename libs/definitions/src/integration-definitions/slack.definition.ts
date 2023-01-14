import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class SlackDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'slack'
  pipedreamKey = 'slack'
  integrationVersion = '1'

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/slack/${type}/${key}/${key}.mjs`)
    return op.default
  }

  extendBindData(bindData: Record<string, any>, { workflow }: OperationRunOptions): Record<string, any> {
    bindData._makeSentViaPipedreamBlock = () => {
      const link = workflow ? `https://chainjet.io/workflow/${workflow.id}` : `https://chainjet.io/integrations/slack`
      return {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Sent via <${link}|ChainJet>`,
          },
        ],
      }
    }
    return bindData
  }
}
