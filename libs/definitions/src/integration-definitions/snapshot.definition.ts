import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class SnapshotDefinition extends SingleIntegrationDefinition {
  integrationKey = 'snapshot'
  integrationVersion = '1'
  schemaUrl = null

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    throw new Error('Method not implemented.')
  }
}
