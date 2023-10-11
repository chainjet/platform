import { Definition, SingleIntegrationData } from '@app/definitions/definition'
import { OpenApiUtils } from '@app/definitions/schema/utils/openApiUtils'
import { IntegrationAuthDefinition } from '@app/definitions/types/IntegrationAuthDefinition'
import { Logger } from '@nestjs/common'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { OpenAPIObject } from 'openapi3-ts'
import { IntegrationAccount } from '../../../apps/api/src/integration-accounts/entities/integration-account'
import { SchemaUtils } from './schema/utils/schema.utils'

/**
 * Integrations without parent, they have their own integration account
 */
export abstract class SingleIntegrationDefinition extends Definition {
  protected readonly logger = new Logger(SingleIntegrationDefinition.name)

  parentKey?: string
  abstract readonly integrationKey: string
  abstract readonly integrationVersion: string
  readonly schemaUrl: string | null = null

  /**
   * Return an array containing only the single integration
   */
  getIntegrationsData(): Promise<SingleIntegrationData[]> | SingleIntegrationData[] {
    return [
      {
        parentKey: this.parentKey,
        integrationKey: this.integrationKey,
        integrationVersion: this.integrationVersion,
        schemaUrl: this.schemaUrl,
      },
    ]
  }

  async createOrUpdateIntegrationAccount(schema: OpenAPIObject): Promise<IntegrationAccount | null> {
    const authDefinition = await this.getAuthDefinition()
    if (!authDefinition) {
      return null
    }
    this.logger.debug(`Creating or updating integration account for ${this.integrationKey}`)
    return await IntegrationAccountService.instance.createOrUpdateOne({
      key: this.integrationKey,
      name: schema.info.title,
      description: '', // TODO
      ...authDefinition,
      fieldsSchema: authDefinition.schema,
    })
  }

  protected async getAuthDefinition(): Promise<IntegrationAuthDefinition | null> {
    const integrationSchema = await SchemaUtils.getSchema({
      integrationKey: this.integrationKey,
      integrationVersion: this.integrationVersion,
    })
    return OpenApiUtils.getAuthDefinition(integrationSchema)
  }
}
