import { IntegrationAuthDefinition, IntegrationAuthType } from '@app/definitions/types/IntegrationAuthDefinition'
import { HttpService } from '@nestjs/axios'
import { Logger } from '@nestjs/common'
import fs from 'fs'
import yaml from 'js-yaml'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject } from 'openapi3-ts'
import { SchemaObject, SecuritySchemeObject } from 'openapi3-ts/dist/model/OpenApi'
import path from 'path'
import { firstValueFrom } from 'rxjs'
import { promisify } from 'util'
import { stripMarkdown } from '../../../../common/src/utils/string.utils'
import prettier from 'prettier'

const convertObj = promisify(require('swagger2openapi').convertObj)

const logger = new Logger('OpenApiUtils')

export const OpenApiUtils = {
  async getSchemaFromUrl(
    url: string,
    fixSchemaAfterFetch: (schema: OpenAPIObject) => OpenAPIObject,
  ): Promise<OpenAPIObject> {
    logger.log(`[GET] ${url}`)
    const schemaRes = await firstValueFrom(new HttpService().request({ url }))
    let spec: OpenAPIObject
    if (typeof schemaRes.data === 'object') {
      spec = schemaRes.data
      logger.debug('Fetched schema with JSON format')
    } else {
      logger.debug('Fetched schema with YAML format - Converting to JSON')
      spec = yaml.safeLoad(schemaRes.data) as OpenAPIObject
    }
    spec = fixSchemaAfterFetch(spec)
    switch (this.getOpenAPIVersion(spec)) {
      case 3:
        logger.debug('Fetched schema is version 3')
        return spec
      case 2:
        logger.debug('Fetched schema is version 2 - Converting to version 3')
        return (await convertObj(spec, { patch: true })).openapi
      default:
        throw new Error('OpenAPI version not found')
    }
  },

  getOpenAPIVersion(spec: OpenAPIObject): 2 | 3 {
    if (spec?.openapi?.startsWith('3.')) {
      return 3
    }
    if (spec?.swagger?.startsWith('2.')) {
      return 2
    }
    throw new Error('Unknown OpenAPI version')
  },

  async getLocalIntegrationSchema(integrationKey: string, integrationVersion: string): Promise<OpenAPIObject | null> {
    try {
      const schemaPath = this.getSchemaFilePath(integrationKey, integrationVersion)
      const schemaJson = (await fs.promises.readFile(schemaPath)).toString()
      return JSON.parse(schemaJson)
    } catch (e) {
      return null
    }
  },

  async stripSchemaMarkdown(spec: OpenAPIObject): Promise<OpenAPIObject> {
    if (spec.info.description) {
      spec.info.description = (await stripMarkdown(spec.info.description)).trim()
    }
    return spec
  },

  getSchemaFilePath(integrationKey: string, integrationVersion: string): string {
    return path.join(__dirname, '../../../schemas/openapi3', `${integrationKey}-${integrationVersion}.json`)
  },

  async saveSchema(schema: OpenAPIObject, integrationKey: string, integrationVersion: string): Promise<any> {
    logger.debug('Saving schema on disk')
    const schemaPath = OpenApiUtils.getSchemaFilePath(integrationKey, integrationVersion)
    const formattedSchema = prettier.format(JSON.stringify(schema), { parser: 'json' })
    await fs.promises.writeFile(schemaPath, formattedSchema)
    logger.debug(`Schema saved on: ${schemaPath}`)
  },

  getAuthDefinition(schema: OpenAPIObject): IntegrationAuthDefinition | null {
    const securitySchemes = schema.components?.securitySchemes

    if (!securitySchemes) {
      // TODO securitySchema and servers variables are not supported together
      const server = schema.servers?.find((server) => Object.keys(server.variables ?? {}).length)
      if (server) {
        const serverVariables = server.variables!
        return {
          authType: IntegrationAuthType.apiKey,
          schema: {
            exposed: [],
            type: 'object',
            required: Object.keys(serverVariables),
            properties: Object.entries(serverVariables).reduce((acc, [key, value]) => {
              acc[key] = {
                type: 'string',
                format: 'password',
                title: value['x-displayName'],
                description: value.description ?? undefined,
                enum: value.enum,
                default: value.default,
              } as JSONSchema7
              return acc
            }, {}),
          },
        }
      }
      return null
    }

    const schemas = (
      Object.entries(securitySchemes).filter(([_, schema]) => (schema as SecuritySchemeObject).type) as Array<
        [string, SecuritySchemeObject]
      >
    )
      .filter(([_, schema]) => !schema.description?.toLowerCase().includes('deprecated'))
      .filter(([_, schema]) => !schema['x-ignore'])

    if (!schemas.length) {
      return null
    }

    // Get the security scheme with more priority (oauth2, oauth1, apiKey, http)
    let securitySchemeEntry =
      schemas.find(([_, schema]) => schema['x-preferred']) ??
      schemas.find(([_, schema]) => schema.type === 'oauth2' && schema.flows?.authorizationCode?.tokenUrl) ??
      schemas.find(([_, schema]) => schema.type === 'http' && schema.scheme === 'oauth1') ??
      schemas.find(([_, schema]) => schema.type === 'apiKey') ??
      schemas.find(([_, schema]) => schema.type === 'http')
    if (!securitySchemeEntry) {
      securitySchemeEntry = schemas[0]
    }

    const [key, securityScheme] = securitySchemeEntry
    switch (securityScheme.type) {
      case 'oauth2':
        return {
          authType: IntegrationAuthType.oauth2,
          securitySchema: this.applySecuritySchemeExtensions(securityScheme),
          securitySchemeKey: key,
        }
      case 'apiKey':
        if (!securityScheme.name) {
          throw new Error('Security scheme must have a name')
        }
        return {
          authType: IntegrationAuthType.apiKey,
          securitySchema: this.applySecuritySchemeExtensions(securityScheme),
          securitySchemeKey: key,
          schema: {
            exposed: [],
            type: 'object',
            required: [securityScheme.name],
            properties: {
              [securityScheme.name]: {
                type: 'string',
                format: 'password',
                title: securityScheme['x-displayName'] || securityScheme.name,
                description: securityScheme.description ?? undefined,
              },
            },
          },
        }
      case 'http':
        if (securityScheme.scheme === 'oauth1') {
          return {
            authType: IntegrationAuthType.oauth1,
            securitySchema: this.applySecuritySchemeExtensions(securityScheme),
            securitySchemeKey: key,
          }
        } else if (securityScheme.scheme === 'basic') {
          return {
            authType: IntegrationAuthType.http,
            securitySchema: this.applySecuritySchemeExtensions(securityScheme),
            securitySchemeKey: key,
            schema: {
              exposed: [],
              type: 'object',
              required: ['username', 'password'],
              description: securityScheme.description ?? undefined,
              properties: {
                username: {
                  type: 'string',
                  title: securityScheme['x-displayName']?.username,
                },
                password: {
                  type: 'string',
                  format: 'password',
                  title: securityScheme['x-displayName']?.password,
                },
              },
            },
          }
        }
        return {
          authType: IntegrationAuthType.http,
          securitySchema: this.applySecuritySchemeExtensions(securityScheme),
          securitySchemeKey: key,
          schema: {
            exposed: [],
            type: 'object',
            required: ['token'],
            properties: {
              token: {
                type: 'string',
                format: 'password',
                title: securityScheme['x-displayName'] ?? 'Token',
                description: securityScheme.description ?? undefined,
              },
            },
          },
        }
      default:
      // TODO
    }
    return null
  },

  applySecuritySchemeExtensions(securityScheme: SecuritySchemeObject): SecuritySchemeObject {
    // x-ignoreScopes
    if (securityScheme.type === 'oauth2' && securityScheme.flows?.authorizationCode?.['x-ignoreScopes']) {
      for (const scope of Object.keys(securityScheme.flows?.authorizationCode?.scopes ?? {})) {
        if (securityScheme.flows.authorizationCode['x-ignoreScopes'].includes(scope)) {
          delete securityScheme.flows.authorizationCode.scopes[scope]
        }
      }
      delete securityScheme.flows.authorizationCode['x-ignoreScopes']
    }

    return securityScheme
  },

  removeUnusedComponents(schema: OpenAPIObject): OpenAPIObject {
    const componentSections = Object.entries(schema.components ?? {}).filter(([key]) => key !== 'securitySchemes')
    let totalRemoved = 0
    for (const [sectionKey, sectionValue] of componentSections) {
      for (const componentKey of Object.keys(sectionValue)) {
        if (!JSON.stringify(schema).includes(`"#/components/${sectionKey}/${componentKey}"`)) {
          delete (schema.components ?? {})[sectionKey][componentKey]
          totalRemoved++
        }
      }
    }

    // Removed components might reference other components
    if (totalRemoved > 0) {
      return OpenApiUtils.removeUnusedComponents(schema)
    }
    return schema
  },

  transformAllSchemaObjects(schema: OpenAPIObject, transform: (obj: SchemaObject) => SchemaObject): OpenAPIObject {
    // transform properties inside path operations
    const pathKeys = Object.keys(schema.paths ?? {})
    for (const key of pathKeys) {
      const methodKeys = Object.keys(schema.paths[key]).filter((key) =>
        ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'].includes(key.toLowerCase()),
      )
      for (const methodKey of methodKeys) {
        schema.paths[key][methodKey].parameters = (schema.paths[key][methodKey].parameters ?? []).map(
          (param) => (schema.paths[key][methodKey].parameters = OpenApiUtils.transformSchemaObject(param, transform)),
        )
      }
    }

    // transform properties inside schema components
    const componentKeys = Object.keys(schema.components?.schemas ?? {})
    for (const key of componentKeys) {
      schema.components!.schemas![key] = OpenApiUtils.transformSchemaObject(schema.components!.schemas![key], transform)
    }
    return schema
  },

  transformSchemaObject(schemaObject: SchemaObject, transform: (obj: SchemaObject) => SchemaObject): SchemaObject {
    const properties = Object.keys(schemaObject.properties ?? {})
    for (const key of properties) {
      schemaObject.properties![key] = OpenApiUtils.transformSchemaObject(schemaObject.properties![key], transform)
    }
    return transform(schemaObject)
  },
}
