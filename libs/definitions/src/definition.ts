import { SchemaService } from '@app/definitions/schema/services/schema.service'
import { Logger } from '@nestjs/common'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { Request } from 'express'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'
import pluralize from 'pluralize'
import request from 'request'
import { Observable } from 'rxjs'
import { AccountCredential } from '../../../apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAccount } from '../../../apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from '../../../apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationAction } from '../../../apps/api/src/integration-actions/entities/integration-action'
import { IntegrationActionService } from '../../../apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from '../../../apps/api/src/integration-triggers/services/integration-trigger.service'
import { Integration } from '../../../apps/api/src/integrations/entities/integration'
import { IntegrationService } from '../../../apps/api/src/integrations/services/integration.service'
import { WorkflowAction } from '../../../apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from '../../../apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunnerService, OperationRunOptions } from '../../../apps/runner/src/services/operation-runner.service'

export interface StepInputs {
  [key: string]: any
}

export interface SingleIntegrationData {
  parentKey?: string
  integrationKey: string
  integrationVersion: string
  schemaUrl: string | null
  deprecated?: boolean
  metadata?: any
}

export interface RequestInterceptorOptions {
  req: request.OptionsWithUrl
  schema: OpenAPIObject
  integration: Integration
  integrationAccount: IntegrationAccount | null
  action: IntegrationAction
  inputs: StepInputs
  credentials: StepInputs
  authorizations: any
}

export type RunOutputs = Record<string, unknown>

export interface RunResponse {
  outputs: RunOutputs
  condition?: boolean
  sleepUntil?: Date
  store?: Record<string, any>
}

export interface GetAsyncSchemasProps {
  integration: Integration
  integrationAccount: IntegrationAccount | null
  inputs: StepInputs
  credentials: StepInputs
  accountCredential: AccountCredential | null
  operationRunnerService: OperationRunnerService
}

export abstract class Definition {
  protected readonly logger: Logger = new Logger(Definition.name)
  readonly validOperationMethods = ['get', 'post', 'put', 'delete', 'patch']
  readonly allowedTriggerMethods = ['get']

  constructor(
    protected readonly schemaService: SchemaService,
    protected readonly integrationService: IntegrationService,
    protected readonly integrationAccountService: IntegrationAccountService,
    protected readonly integrationActionService: IntegrationActionService,
    protected readonly integrationTriggerService: IntegrationTriggerService,
  ) {}

  protected _triggerNamePrefixes = ['get', 'gets', 'list all', 'lists all', 'list', 'lists', 'returns a list of']

  get triggerNamePrefixes(): string[] {
    return this._triggerNamePrefixes
  }

  abstract getIntegrationsData(): Promise<SingleIntegrationData[]> | SingleIntegrationData[]

  abstract createOrUpdateIntegrationAccount(
    schema: OpenAPIObject,
    integrationData: SingleIntegrationData,
  ): Promise<IntegrationAccount | null>

  /**
   * Integrations that need to run an operation after the account credential was created need to override this method.
   * Operation Runner will take these options and run the operation.
   */
  async getInitOperationOptions(opts: {
    integration: Integration
    integrationAccount: IntegrationAccount | null
    credentials: StepInputs
    accountCredential: AccountCredential | null
  }): Promise<OperationRunOptions | null> {
    return null
  }

  /**
   * Hook for integrations that define "getInitOperationOptions". This hook receives the outputs of that operation.
   * Returns entities to be updated
   */
  async afterInitOperationRun(
    outputs: Record<string, unknown>,
    opts: OperationRunOptions,
  ): Promise<{ accountCredential?: AccountCredential }> {
    return {}
  }

  /**
   * Allows definitions to modify the workflow action entity before it is created
   */
  async beforeCreateWorkflowAction(
    workflowAction: DeepPartial<WorkflowAction>,
    integrationAction: IntegrationAction,
  ): Promise<DeepPartial<WorkflowAction>> {
    return workflowAction
  }

  /**
   * Allows definitions to modify the workflow action entity before it is updated
   */
  async beforeUpdateWorkflowAction(
    workflowAction: DeepPartial<WorkflowAction>,
    integrationAction: IntegrationAction,
  ): Promise<DeepPartial<WorkflowAction>> {
    return workflowAction
  }

  /**
   * Allows definitions to modify the workflow trigger entity before it is created
   */
  async beforeCreateWorkflowTrigger(
    workflowTrigger: DeepPartial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
  ): Promise<DeepPartial<WorkflowTrigger>> {
    return workflowTrigger
  }

  /**
   * Allows definitions to modify the workflow trigger entity before it is updated
   */
  async beforeUpdateWorkflowTrigger(
    workflowTrigger: DeepPartial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
  ): Promise<DeepPartial<WorkflowTrigger>> {
    return workflowTrigger
  }

  /**
   * Triggered when a hook is received. Returns true if the hook should continue, false otherwise.
   */
  async onHookReceived(req: Request, workflowTrigger: WorkflowTrigger): Promise<boolean> {
    return true
  }

  /**
   * Allows integrations to modify the options before running an operation
   */
  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    return opts
  }

  /**
   * Allows integrations to modify the outputs after running an operation
   */
  async afterOperationRun(
    opts: OperationRunOptions,
    outputs: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return outputs
  }

  /**
   * Allows integrations to entirely replace the run functionality
   * Response is either directly the object with the response or an observable which emits one or more responses
   * Observable responses are only used by triggers
   */
  run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse>> | null {
    return null
  }

  /**
   * Intercepts requests and allows to modify the request object before calling the integration
   */
  requestInterceptor({ req }: RequestInterceptorOptions): request.OptionsWithUrl {
    return req
  }

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    return operationSchema
  }

  isValidTrigger(operation: OperationObject, schemaMethod: string, schemaResponse?: JSONSchema7): boolean {
    const triggerSupported =
      operation['x-triggerHook'] ||
      operation['x-triggerInstant'] ||
      operation['x-triggerName'] ||
      this.allowedTriggerMethods.includes(schemaMethod ?? '')

    if (operation['x-actionOnly'] || !schemaResponse || !triggerSupported) {
      return false
    }

    // sorted methods cannot be triggers
    if (operation.description?.toLowerCase().includes('sorted by')) {
      return false
    }

    return true
  }

  mapTriggerName(operationSchema: OperationObject): string {
    const name = operationSchema.summary
    if (!name) {
      throw new Error('Cannot set trigger name')
    }

    for (const prefix of this.triggerNamePrefixes) {
      if (name.toLowerCase().startsWith(prefix + ' ')) {
        return (
          'New ' +
          name
            .substr(prefix.length + 1)
            .split(' ')
            .map((name) => pluralize.singular(name))
            .join(' ')
        )
      }
    }

    // List examples; List all examples; Get examples => New example
    const nameRegex = /^(get|gets|list all|lists all|list|lists|returns a list of)\s+/i
    if (nameRegex.test(name)) {
      return (
        'New ' +
        name
          .replace(nameRegex, '')
          .split(' ')
          .map((name) => pluralize.singular(name))
          .join(' ')
      )
    }

    return name
  }

  mapTriggerDescription(operationSchema: OperationObject): string | undefined {
    return operationSchema.description
  }

  /**
   * Allow integrations to apply modifications to the schema after fetching it from an external source
   * This method is called before the schema is transformed to OpenApi V3
   */
  updateSchemaAfterFetch(schema: OpenAPIObject): OpenAPIObject {
    return schema
  }

  /**
   * Allow integrations to apply modifications to the schema before saving
   */
  async updateSchemaBeforeSave(schema: OpenAPIObject, integrationData: SingleIntegrationData): Promise<OpenAPIObject> {
    return schema
  }

  /**
   * Allows integrations to modify the schema before before installing the integration, but after the file was saved
   */
  async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
    return schema
  }

  /**
   * Returns the name of the field that identifies the target item in the response array (e.g. "id", "itemId")
   */
  getTriggerIdField(schema: JSONSchema7, parentProperty: string, operationObject: OperationObject): string | null {
    const keys: string[] = Object.keys(schema.properties ?? {})
    return keys.find((field) => field.toLowerCase() === 'id') ?? null
  }

  /**
   * Operations with dynamic schemas must override this method and return their schema
   * Currently this is only implemented for hook based triggers
   */
  getDynamicSchemaResponse(req: Request): JSONSchema7 | null {
    return null // TODO
  }

  /**
   * Operations with dynamic schemas can override this method if their schema is different from the response (e.g. webhook trigger)
   * Currently this is only implemented for hook based triggers
   */
  async getDynamicSchemaOutputs(req: Request): Promise<Record<string, unknown>> {
    return req?.body
  }

  asyncSchemas: { [key: string]: (props: GetAsyncSchemasProps) => Promise<JSONSchema7> } = {}
}
