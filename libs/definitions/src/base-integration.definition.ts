import { SingleIntegrationData } from './definition'
import { SingleIntegrationDefinition } from './single-integration.definition'
import { IntegrationAuthDefinition } from './types/IntegrationAuthDefinition'

export abstract class BaseIntegrationDefinition extends SingleIntegrationDefinition {
  abstract title: string
  abstract logo: string
  categories: string[] = []

  getIntegrationsData(): Promise<SingleIntegrationData[]> | SingleIntegrationData[] {
    return [
      {
        parentKey: this.parentKey,
        integrationKey: this.integrationKey,
        integrationVersion: this.integrationVersion,
        schemaUrl: this.schemaUrl,
        noSchemaFile: true,
      },
    ]
  }

  // TODO: support auth without schema
  protected async getAuthDefinition(): Promise<IntegrationAuthDefinition | null> {
    return null
  }
}
