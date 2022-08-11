import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class GraphqlDefinition extends SingleIntegrationDefinition {
  integrationKey = 'graphql'
  integrationVersion = '1'
  schemaUrl = null

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const res = await fetch(inputs.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: inputs.query }),
    })
    return {
      outputs: await res.json(),
    }
  }
}
