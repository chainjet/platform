import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

// Documentation: https://docs.google.com/document/d/1tzQP0aTBPaEVJGR3fhkfb80u8GB7Sq7JmUGfrmTqvYA/edit

export class CalendlyDefinition extends SingleIntegrationDefinition {
  integrationKey = 'calendly'
  integrationVersion = '2'
  schemaUrl =
    'https://developer.calendly.com/api/v1/projects/calendly/api-docs/nodes/reference/calendly-api/openapi.yaml?branch=production&deref=bundle'
}
