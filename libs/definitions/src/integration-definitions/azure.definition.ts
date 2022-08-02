import { MultiIntegrationDefinition } from '@app/definitions/multi-integration.definition'
import { Logger } from '@nestjs/common'
import _ from 'lodash'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'
import { IntegrationAccount } from '../../../../apps/api/src/integration-accounts/entities/integration-account'
import { isEmptyObj } from '../../../common/src/utils/object.utils'
import { SingleIntegrationData } from '../definition'
import { SingleIntegrationDefinition } from '../single-integration.definition'

export class AzureDefinition extends MultiIntegrationDefinition {
  protected readonly logger = new Logger(AzureDefinition.name)
  protected integrationAccount: IntegrationAccount | undefined

  parentKey: string = 'azure'
  parentName: string = 'Azure'
  schemaUrl = 'https://raw.githubusercontent.com/microsoftgraph/microsoft-graph-openapi/master/v1.0.json'

  tags: Record<string, RegExp> = {
    'microsoft-onenote': /me\.onenote(\..+)?/,
    'outlook-calendar': /me\.calendars(\..+)?/,
  }

  getIntegrationsData(): SingleIntegrationData[] | Promise<SingleIntegrationData[]> {
    return [
      {
        parentKey: this.parentKey,
        integrationKey: 'microsoft-onenote',
        integrationVersion: '1',
        schemaUrl: 'https://raw.githubusercontent.com/microsoftgraph/microsoft-graph-openapi/master/v1.0.json',
        deprecated: false,
      },
      {
        parentKey: this.parentKey,
        integrationKey: 'outlook-calendar',
        integrationVersion: '1',
        schemaUrl: 'https://raw.githubusercontent.com/microsoftgraph/microsoft-graph-openapi/master/v1.0.json',
        deprecated: false,
      },
    ]
  }

  async updateSchemaBeforeSave(schema: OpenAPIObject, integrationData: SingleIntegrationData): Promise<OpenAPIObject> {
    if (!this.tags[integrationData.integrationKey]) {
      throw new Error(`Tag scope not found for ${integrationData.integrationKey}`)
    }
    for (const [pathKey, pathValue] of Object.entries(schema.paths)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      for (const [operationKey, operationValue] of Object.entries(pathValue) as Array<[string, OperationObject]>) {
        if (
          !operationValue.tags ||
          !operationValue.tags.some((tag) => this.tags[integrationData.integrationKey].test(tag))
        ) {
          delete schema.paths[pathKey][operationKey]
        }
      }
      if (isEmptyObj(schema.paths[pathKey])) {
        delete schema.paths[pathKey]
      }
    }
    schema.tags = schema.tags?.filter((tag) => this.tags[integrationData.integrationKey].test(tag.name))
    schema.tags = _.uniqBy(schema.tags, (tag) => tag.name)
    return schema
  }

  async createOrUpdateIntegrationAccount(
    schema: OpenAPIObject,
    integrationData: SingleIntegrationData,
  ): Promise<IntegrationAccount | null> {
    class MicrosoftIntegration extends SingleIntegrationDefinition {
      parentKey = 'azure'
      integrationKey = integrationData.integrationKey
      integrationVersion = integrationData.integrationVersion
      schemaUrl = integrationData.schemaUrl
    }
    const integration = new MicrosoftIntegration(
      this.schemaService,
      this.integrationService,
      this.integrationAccountService,
      this.integrationActionService,
      this.integrationTriggerService,
    )
    return await integration.createOrUpdateIntegrationAccount(schema)
  }
}
