import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OpenAPIObject } from 'openapi3-ts'
import { Observable } from 'rxjs'
import { RunResponse } from '../definition'
import { runSubgraphOperation, updateSubgraphSchemaBeforeInstall } from '../utils/subgraph.utils'

export class UniswapV3Definition extends SingleIntegrationDefinition {
  integrationKey = 'uniswapv3'
  integrationVersion = '1'
  schemaUrl = null

  endpoints = {
    default: 1,
    1: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  }

  async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse>> {
    return runSubgraphOperation(this.endpoints, opts)
  }

  async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
    return updateSubgraphSchemaBeforeInstall(this.endpoints, schema)
  }
}
