import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class WhatsappBusinessDefinition extends SingleIntegrationDefinition {
  integrationKey = 'whatsapp-business'
  integrationVersion = '1'
  schemaUrl = 'https://raw.githubusercontent.com/unblu/WhatsApp-Business-API-OpenAPI/master/openapi.yaml'
}
