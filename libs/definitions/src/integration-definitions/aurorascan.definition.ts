import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject } from 'openapi3-ts'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

export class AurorascanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'aurorascan'
  integrationVersion = '1'
  schemaUrl = null

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const etherscanScehma = await OpenApiUtils.getLocalIntegrationSchema('etherscan', '1')
    schema.paths = etherscanScehma!.paths
    return schema
  }
}
