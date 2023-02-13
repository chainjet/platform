import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject } from 'openapi3-ts'
import { SecuritySchemeObject } from 'openapi3-ts/src/model/OpenApi'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class GoogleSheetsDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'google-sheets'
  pipedreamKey = 'google_sheets'
  integrationVersion = '1'
  schemaUrl = null

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const securityScheme = schema.components?.securitySchemes?.Oauth2c as SecuritySchemeObject
    // Use Google Client ID and Secret
    if (securityScheme) {
      securityScheme['x-credentialsKey'] = 'google'
    }

    // Google APIs require extra parameters in order to send back the refresh token
    if (securityScheme?.flows?.authorizationCode) {
      securityScheme.flows.authorizationCode.authorizationUrl =
        'https://accounts.google.com/o/oauth2/auth?prompt=consent&access_type=offline'
    }

    return super.updateSchemaBeforeSave(schema)
  }

  async getExternalOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/google_sheets/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
