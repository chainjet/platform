import { Request } from 'express'
import { JSONSchema7 } from 'json-schema'
import { generateSchemaFromObject } from '../schema/utils/jsonSchemaUtils'
import { SingleIntegrationDefinition } from '../single-integration.definition'

export class WebhookDefinition extends SingleIntegrationDefinition {
  integrationKey = 'webhook'
  integrationVersion = '1'
  schemaUrl = null

  getDynamicSchemaResponseFromRequest(req: Request): JSONSchema7 | null {
    const querySchema = generateSchemaFromObject(req.query ?? {})
    const bodySchema = generateSchemaFromObject(req.body ?? {})
    const headersSchema = generateSchemaFromObject(req.headers ?? {})
    return {
      type: 'object',
      properties: {
        query: querySchema,
        body: bodySchema,
        headers: headersSchema,
      },
    }
  }

  async getDynamicSchemaOutputs(req: Request): Promise<Record<string, unknown>> {
    return {
      queryParams: req.query ?? {},
      body: req.body ?? {},
      headers: req.headers ?? {},
      httpMethod: req.method,
    }
  }
}
