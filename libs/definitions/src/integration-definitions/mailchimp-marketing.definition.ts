import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'

export class MailchimpMarketingDefinition extends SingleIntegrationDefinition {
  integrationKey = 'mailchimp-marketing'
  integrationVersion = '3'
  schemaUrl = 'https://api.mailchimp.com/schema/3.0/Swagger.json?expand'

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    // Add tags and remove uneccesary responses
    const tags = new Set<string>()
    delete schema.paths['/']
    for (const path of Object.values(schema.paths)) {
      delete path.$ref
      for (const method of Object.values(path as Record<string, OperationObject>)) {
        for (const tag of method.tags ?? []) {
          tags.add(tag)
        }
        delete method.responses.default
        if (method.responses?.[200]?.content?.['application/problem+json']) {
          delete method.responses[200].content['application/problem+json']
        }
      }
    }

    schema.tags = schema.tags ?? []
    for (const tag of Array.from(tags)) {
      if (!schema.tags.find((t) => t.name === tag)) {
        schema.tags.push({
          name: tag,
          description: tag,
        })
      }
    }

    return schema
  }
}
