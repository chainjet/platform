import { JSONSchema7 } from 'json-schema'
import { SecuritySchemeObject } from 'openapi3-ts'

export enum IntegrationAuthType {
  apiKey = 'apiKey',
  http = 'http',
  oauth1 = 'oauth1',
  oauth2 = 'oauth2',
  openIdConnect = 'openIdConnect',
  custom = 'custom',
}

export interface IntegrationAuthDefinition {
  authType: IntegrationAuthType
  schema?: JSONSchema7 & { exposed?: string[] }
  securitySchema?: SecuritySchemeObject
  securitySchemeKey?: string
}
