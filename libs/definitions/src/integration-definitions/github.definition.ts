import { deleteObjectKeysDeep } from '@app/common/utils/object.utils'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject } from 'openapi3-ts'
import request from 'request'
import { RequestInterceptorOptions } from '..'

export class GithubDefinition extends SingleIntegrationDefinition {
  integrationKey = 'github'
  integrationVersion = '3'
  schemaUrl =
    'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json'

  updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    if (!schema.components?.examples) {
      return Promise.resolve(schema)
    }

    // Some examples use $ref with unaccesible URL, we need to remove them
    const fixKeys = ['scim-enterprise-group', 'scim-enterprise-group-2', 'scim-enterprise-group-list']
    for (const key of fixKeys) {
      schema.components.examples[key] = deleteObjectKeysDeep(
        schema.components.examples[key] as Record<string, any>,
        (key) => key === '$ref',
      )
    }

    return Promise.resolve(schema)
  }

  requestInterceptor({ req }: RequestInterceptorOptions): request.OptionsWithUrl {
    req.headers = req.headers ?? {}
    req.headers.Accept = 'application/vnd.github.v3+json'
    return req
  }
}
