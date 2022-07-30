import { deleteObjectKeysDeep } from '@app/common/utils/object.utils'
import { OpenApiUtils } from '@app/definitions/schema/utils/openApiUtils'
import { Injectable, Logger } from '@nestjs/common'
import defaultsDeep from 'lodash.defaultsdeep'
import { OpenAPIObject } from 'openapi3-ts'

export interface GetSchemaOptions {
  integrationKey: string
  integrationVersion: string
  schemaUrl?: string | null
  refetch?: boolean
  ignoreCache?: boolean
  updateSchemaAfterFetch?: (schema: OpenAPIObject) => OpenAPIObject
}

export interface UpdateSchemaOptions {
  integrationKey: string
  integrationVersion: string
  schema: OpenAPIObject
}

@Injectable()
export class SchemaService {
  private readonly logger = new Logger(SchemaService.name)
  private readonly schemaCache: Map<string, OpenAPIObject> = new Map()

  getSchemaKey (integrationKey: string, integrationVersion: string): string {
    return `${integrationKey}-${integrationVersion}`
  }

  async getSchema ({
    integrationKey,
    integrationVersion,
    schemaUrl,
    refetch,
    ignoreCache,
    updateSchemaAfterFetch
  }: GetSchemaOptions): Promise<OpenAPIObject> {
    const schemaKey = this.getSchemaKey(integrationKey, integrationVersion)
    if (!ignoreCache && this.schemaCache.has(schemaKey)) {
      return this.schemaCache.get(schemaKey) as OpenAPIObject
    }

    let schema = await OpenApiUtils.getLocalIntegrationSchema(
      integrationKey,
      integrationVersion
    )

    schema = schema ?? {
      openapi: '3.0.0',
      info: {
        title: integrationKey,
        version: integrationVersion
      },
      paths: {}
    }

    if (refetch && schemaUrl) {
      if (!updateSchemaAfterFetch) {
        throw new Error('Fix schema after save must be defined when fetching from an external source')
      }
      const schemaFromUrl = await OpenApiUtils.getSchemaFromUrl(schemaUrl, updateSchemaAfterFetch)

      // Delete OpenAPI extensions from external sources
      const cleanSchema = deleteObjectKeysDeep(schemaFromUrl, key => key.startsWith('x-'))

      schema = defaultsDeep(schema ?? {}, cleanSchema)
    }

    this.logger.debug(`Caching schema ${schemaKey}`)
    this.schemaCache.set(schemaKey, schema as OpenAPIObject)

    return schema as OpenAPIObject
  }

  updateSchema ({
    integrationKey,
    integrationVersion,
    schema
  }: UpdateSchemaOptions): Promise<void> {
    const schemaKey = this.getSchemaKey(integrationKey, integrationVersion)
    this.schemaCache.set(schemaKey, schema)
    return OpenApiUtils.saveSchema(schema, integrationKey, integrationVersion)
  }
}
