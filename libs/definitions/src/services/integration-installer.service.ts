import { Injectable, Logger } from '@nestjs/common'
import { mongoose } from '@typegoose/typegoose'
import { JSONSchema7 } from 'json-schema'
import { ObjectID } from 'mongodb'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'
import { Definition, SingleIntegrationData } from '..'
import { IntegrationAccount } from '../../../../apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationActionService } from '../../../../apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from '../../../../apps/api/src/integration-triggers/services/integration-trigger.service'
import { Integration } from '../../../../apps/api/src/integrations/entities/integration'
import { OperationCategory } from '../../../../apps/api/src/integrations/entities/operation-category'
import { IntegrationService } from '../../../../apps/api/src/integrations/services/integration.service'
import { getItemSchemaFromRes } from '../../../../apps/runner/src/utils/trigger.utils'
import { decycle, retrocycle } from '../../../common/src/utils/json.utils'
import { addEllipsis, stripMarkdown, stripMarkdownSync } from '../../../common/src/utils/string.utils'
import { SchemaService } from '../schema/services/schema.service'
import { openapi2schema } from '../schema/utils/openapi2schema'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

@Injectable()
export class IntegrationInstallerService {
  private readonly logger = new Logger(IntegrationInstallerService.name)

  constructor(
    private readonly schemaService: SchemaService,
    private readonly integrationService: IntegrationService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly integrationActionService: IntegrationActionService,
  ) {}

  /**
   * Creates or updates integration(s), integration account(s) and integration operations
   */
  async install(definition: Definition): Promise<void> {
    const integrationsData = await definition.getIntegrationsData()
    for (const integrationData of integrationsData) {
      try {
        this.logger.log(`Installing ${integrationData.integrationKey}...`)
        const schema = await this.updateIntegrationSchema(definition, integrationData)
        if (schema) {
          const { integration } = await this.createOrUpdateIntegration(definition, schema, integrationData)
          await this.installIntegration(definition, integration, schema)
          await this.updateIntegrationCounters(integration)
        }
      } catch (e) {
        this.logger.error(`Error installing ${integrationData.integrationKey}: ${e.message}`)
      }
    }
  }

  /**
   * Creates or updates a single integration, including the integration account, integration operations and schemas
   */
  protected async installIntegration(
    definition: Definition,
    integration: Integration,
    schema: OpenAPIObject,
  ): Promise<void> {
    const jsonSchema = await openapi2schema(OpenApiUtils.getSchemaFilePath(integration.key, integration.version))

    for (const [schemaPath, pathSpec] of Object.entries(schema.paths)) {
      const operationEntries = Object.entries(pathSpec)
        .filter((entry: [string, OperationObject]) => !entry[1]['x-ignore'] && !entry[1].deprecated)
        .filter((entry) => definition.validOperationMethods.includes(entry[0].toLowerCase()))

      for (const [schemaMethod, operationSchema] of operationEntries) {
        const operationObject = operationSchema as OperationObject

        if (!operationObject.operationId) {
          operationObject.operationId = `${schemaPath}.${schemaMethod}`
        }

        if (!operationObject.summary) {
          throw new Error(`Missing summary for operation ${operationObject.operationId}`)
        }

        const operationJsonSchema = jsonSchema?.[schemaPath]?.[schemaMethod]
        if (operationJsonSchema?.request) {
          // clean JSON Schemas
          operationJsonSchema.request = this.cleanJSONSchema(operationJsonSchema.request)
          operationJsonSchema.responses = Object.entries(operationJsonSchema.responses ?? {}).reduce(
            (prev, [key, value]) => {
              prev[key] = this.cleanJSONSchema(value)
              return prev
            },
            {},
          )

          const actionSchemaResponse = this.getSuccessfulResponseSchema(operationJsonSchema.responses)

          await this.installIntegrationAction(
            integration,
            operationObject,
            schemaPath,
            schemaMethod,
            operationJsonSchema.request,
            actionSchemaResponse,
          )
          await this.installIntegrationTrigger(
            definition,
            integration,
            operationObject,
            schemaPath,
            schemaMethod,
            operationJsonSchema.request,
            actionSchemaResponse,
          )
        }
      }
    }
  }

  protected async installIntegrationAction(
    integration: Integration,
    operationObject: OperationObject,
    schemaPath: string,
    schemaMethod: string,
    schemaRequest: JSONSchema7,
    schemaResponse: JSONSchema7 | undefined,
  ): Promise<void> {
    if (!operationObject['x-noAction']) {
      const plainTextDescription = operationObject.description && (await stripMarkdown(operationObject.description))
      await this.integrationActionService.createOrUpdateOne({
        key: operationObject.operationId,
        name: operationObject.summary,
        integration: new mongoose.Types.ObjectId(integration.id),
        description: plainTextDescription && addEllipsis(plainTextDescription, 500),
        fullDescription: operationObject.description,
        deprecated: !!operationObject.deprecated,
        category: operationObject.tags?.[0],
        skipAuth: !!operationObject['x-skipAuth'],
        schemaId: operationObject.operationId,
        schemaPath,
        schemaMethod,
        schemaRequest,
        schemaResponse,
      })
    }
  }

  protected async installIntegrationTrigger(
    definition: Definition,
    integration: Integration,
    operationObject: OperationObject,
    schemaPath: string,
    schemaMethod: string,
    schemaRequest: JSONSchema7,
    actionSchemaResponse: JSONSchema7 | undefined,
  ): Promise<void> {
    const triggerResponseData = await this.getTriggerResponseData(
      definition,
      operationObject,
      schemaMethod,
      actionSchemaResponse,
    )
    if (triggerResponseData) {
      await this.integrationTriggerService.createOrUpdateOne({
        key: operationObject.operationId,
        name: triggerResponseData.name,
        integration: new mongoose.Types.ObjectId(integration.id),
        description: triggerResponseData.description,
        fullDescription: triggerResponseData.description,
        deprecated: !!operationObject.deprecated,
        category: operationObject.tags?.[0],
        skipAuth: !!operationObject['x-skipAuth'],
        schemaId: operationObject.operationId,
        schemaPath,
        schemaMethod,
        schemaRequest,
        schemaResponse: triggerResponseData.schemaRes,
        triggerPopulate: operationObject['x-triggerPopulate'],
        idKey: triggerResponseData.idKey,
        instant: !!operationObject['x-triggerInstant'] || !!operationObject['x-triggerHook'],
        isWebhook: !!operationObject['x-triggerHook'],
        hookInstructions: operationObject['x-triggerHookInstructions'],
        dynamicSchemaResponse: !!operationObject['x-dynamicSchemaResponse'],
      })
    }
  }

  protected async updateIntegrationSchema(
    definition: Definition,
    integrationData: SingleIntegrationData,
  ): Promise<OpenAPIObject | null> {
    // Never fetch external schemas on production
    const schemaUrl = process.env.NODE_ENV !== 'production' ? integrationData.schemaUrl : null

    const { integrationKey, integrationVersion } = integrationData

    let schema = await this.schemaService.getSchema({
      integrationKey: integrationKey,
      integrationVersion: integrationVersion,
      schemaUrl,
      refetch: true,
      updateSchemaAfterFetch: definition.updateSchemaAfterFetch,
    })

    // Don't create draft integrations on production
    if (schema.info['x-draft'] && process.env.NODE_ENV === 'production') {
      this.logger.log(`Integration ${integrationData.integrationKey} is marked as draft and won't be installed on prod`)
      return null
    }

    if (integrationData.metadata) {
      schema['x-metadata'] = {
        ...integrationData.metadata,
        ...(schema['x-metadata'] ?? {}),
      }
    }
    if (integrationData.deprecated) {
      schema.info['x-deprecated'] = true
    }

    schema = await OpenApiUtils.stripSchemaMarkdown(schema)
    schema = this.mapSchemaOperations(definition, schema)
    schema = await definition.updateSchemaBeforeSave(schema, integrationData)
    schema = OpenApiUtils.removeUnusedComponents(schema)

    await this.schemaService.updateSchema({
      schema,
      integrationKey,
      integrationVersion,
    })

    return schema
  }

  mapSchemaOperations(definition: Definition, schema: OpenAPIObject): OpenAPIObject {
    for (const [pathKey, pathValue] of Object.entries(schema.paths)) {
      for (const [methodKey, methodValue] of Object.entries(pathValue)) {
        if (definition.validOperationMethods.includes(methodKey.toLowerCase())) {
          const operation = methodValue as OperationObject
          if (!operation.operationId) {
            operation.operationId = `${pathKey}.${methodKey}`
          }
          schema.paths[pathKey][methodKey] = definition.mapSchemaOperation(operation)
        }
      }
    }
    return schema
  }

  /**
   * Returns the schema for a successful response from a map of number to JSONSchema7
   * If there are responses for more than one success status (200-299), the lowest one is returned
   */
  protected getSuccessfulResponseSchema(responses: Record<number, JSONSchema7>): JSONSchema7 | undefined {
    // Currently the lowest status is returned, in the future we could do something smarter here if needed
    return Object.entries(responses)
      .filter(([status]) => Number(status) >= 200 && Number(status) <= 299)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map((entry) => entry[1])?.[0]
  }

  protected cleanJSONSchema(schema: JSONSchema7): JSONSchema7 {
    delete schema.$schema
    delete schema.title
    delete schema.description
    return schema
  }

  /**
   * Returns an object containing
   *   idKey: string which identifies the target ID in the response (e.g. "items[].itemId")
   *   schemaRes: JSON Schema of a single target object (which contains the ID)
   *   name: trigger name
   *   description: shorten trigger description without markdown
   *   fullDescription: markdown trigger description
   */
  protected async getTriggerResponseData(
    definition: Definition,
    operationObject: OperationObject,
    schemaMethod: string,
    schemaResponse?: JSONSchema7,
  ): Promise<{
    idKey: string | undefined
    schemaRes: JSONSchema7
    name: string
    description: string | undefined
    fullDescription: string | undefined
  } | null> {
    const triggerSupported =
      operationObject['x-triggerHook'] ||
      operationObject['x-triggerInstant'] ||
      operationObject['x-triggerName'] ||
      definition.allowedTriggerMethods.includes(schemaMethod ?? '')
    if (operationObject['x-noTrigger'] || !schemaResponse || !triggerSupported) {
      return null
    }
    console.log(`triggerSupported =>`, triggerSupported)

    const actionRes = retrocycle(schemaResponse) as JSONSchema7
    let itemsSchema: JSONSchema7 | null | undefined
    let idKey = ''
    let idField: string | null = null

    // if response is an object containing a single array, use it as items schema
    if (actionRes.type === 'object' && actionRes.properties) {
      const arrayProps = Object.entries(actionRes.properties).filter(
        ([_, property]) => typeof property !== 'boolean' && property.type === 'array',
      )
      if (arrayProps.length === 1) {
        idKey = arrayProps[0][0]
        itemsSchema = arrayProps[0][1] as JSONSchema7
      }
    }

    // if response is an array, use it as items schema
    if (actionRes.type === 'array') {
      itemsSchema = actionRes
    }

    // if items schema is an array of objects containing an ID field, use it as key
    if (itemsSchema?.type === 'array' && !Array.isArray(itemsSchema.items)) {
      if (typeof itemsSchema.items !== 'boolean' && itemsSchema.items?.type === 'object') {
        idField = definition.getTriggerIdField(itemsSchema.items, idKey, operationObject)
        itemsSchema = itemsSchema.items
      }
    }

    // if x-triggerIdKey has been defined, extract itemSchema from response
    if (operationObject['x-triggerIdKey']) {
      itemsSchema = getItemSchemaFromRes(operationObject['x-triggerIdKey'], actionRes)
    } else if (operationObject['x-triggerInstant'] || operationObject['x-triggerHook']) {
      idField = '.'
      itemsSchema = getItemSchemaFromRes(idField, actionRes)
    }

    if (itemsSchema && (operationObject['x-triggerIdKey'] || idField)) {
      const triggerName = operationObject['x-triggerName'] ?? definition.mapTriggerName(operationObject)
      const description = operationObject['x-triggerDescription'] ?? definition.mapTriggerDescription(operationObject)
      const plainTextDescription = description && (await stripMarkdown(description))
      return {
        idKey: operationObject['x-triggerIdKey'] ?? `${idKey}[].${idField}`,
        schemaRes: decycle(itemsSchema) as JSONSchema7,
        name: triggerName,
        description: plainTextDescription && addEllipsis(plainTextDescription, 500),
        fullDescription: description,
      }
    }

    return null
  }

  /**
   * Update number of actions and triggers on the integration and each category
   */
  protected async updateIntegrationCounters(integration: Integration): Promise<void> {
    this.logger.debug(`Updating counters for ${integration.key}`)

    const query = {
      integration: integration.id,
      deprecated: false,
    }
    const triggers = await this.integrationTriggerService.find(query)
    const actions = await this.integrationActionService.find(query)

    const operationCategories: OperationCategory[] = (integration.operationCategories ?? [])
      .map((category) => ({
        ...category,
        numberOfTriggers: triggers.filter((trigger) => trigger.category === category.key).length,
        numberOfActions: actions.filter((action) => action.category === category.key).length,
      }))
      .filter((category) => category.numberOfTriggers || category.numberOfActions)

    await this.integrationService.updateOne(integration.id, {
      operationCategories,
      numberOfTriggers: triggers.length,
      numberOfActions: actions.length,
    })

    this.logger.log(
      `${integration.key} updated with ${triggers.length} triggers, ${actions.length} actions ` +
        `on ${operationCategories.length} categories`,
    )
  }

  protected async createOrUpdateIntegration(
    definition: Definition,
    schema: OpenAPIObject,
    integrationData: SingleIntegrationData,
  ): Promise<{ integrationAccount: IntegrationAccount | null; integration: Integration }> {
    this.logger.debug('Creating or updating integration')
    const integrationAccount = await definition.createOrUpdateIntegrationAccount(schema, integrationData)
    const integration = await this.integrationService.createOrUpdateOne({
      parentKey: integrationData.parentKey,
      key: integrationData.integrationKey,
      name: schema.info.title,
      description: schema.info.description,
      logo: schema.info['x-logo']?.url,
      version: integrationData.integrationVersion,
      deprecated: !!schema.info['x-deprecated'],
      integrationAccount: integrationAccount ? new ObjectID(integrationAccount.id) : undefined,
      integrationCategories: schema.info['x-categories'] ?? [],
      operationCategories: (schema.tags ?? []).map((tag) => ({
        key: tag.name,
        name: tag['x-displayName'] || tag.name,
        description: tag.description && stripMarkdownSync(tag.description),
      })),
    })
    return {
      integrationAccount: integrationAccount,
      integration: integration,
    }
  }
}
