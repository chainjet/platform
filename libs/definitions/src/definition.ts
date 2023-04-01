import { Logger } from '@nestjs/common'
import { AccountCredentialService } from 'apps/api/src/account-credentials/services/account-credentials.service'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { Request } from 'express'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'
import pluralize from 'pluralize'
import request from 'request'
import { Observable } from 'rxjs'
import { AccountCredential } from '../../../apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAccount } from '../../../apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAction } from '../../../apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTriggerService } from '../../../apps/api/src/integration-triggers/services/integration-trigger.service'
import { Integration } from '../../../apps/api/src/integrations/entities/integration'
import { WorkflowAction } from '../../../apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from '../../../apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunnerService, OperationRunOptions } from '../../../apps/runner/src/services/operation-runner.service'
import { Operation } from './operation'
import { OperationTrigger } from './operation-trigger'
import { OperationOffChain } from './opertion-offchain'

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

export type RunOutputs = Record<string, unknown> // TODO outputs can be an array

export interface RunResponse {
  outputs: RunOutputs
  condition?: boolean
  sleepUntil?: Date
  store?: Record<string, any>
  refreshedCredentials?: Record<string, any>
  transactions?: Array<{ hash: string; chainId: number }>
  nextCheck?: Date | null // null disables the trigger
  stop?: boolean // if true, stop the workflow
  repeatKey?: string
  cursor?: string // cursor for pagination when fetching all items
}

export type GetAsyncSchemasProps = OperationRunOptions & {
  operationRunnerService: OperationRunnerService
}

export interface IntegrationHookInjects {
  integrationTriggerService: IntegrationTriggerService
  workflowTriggerService: WorkflowTriggerService
  integrationAccountService: IntegrationAccountService
  accountCredentialsService: AccountCredentialService
}

export abstract class Definition {
  protected readonly logger: Logger = new Logger(Definition.name)
  readonly validOperationMethods = ['get', 'post', 'put', 'delete', 'patch']
  readonly allowedTriggerMethods = ['get']
  triggers: OperationTrigger[] = []
  actions: Operation[] = []

  constructor() {}

  get operations() {
    return [...this.triggers, ...this.actions]
  }

  _triggerNamePrefixes = ['get', 'gets', 'list all', 'lists all', 'list', 'lists', 'returns a list of']

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
   * Returns the response of a hook defined on the operation
   */
  _getOperationHookRes<T>(hookKey: string, operationKey: string, args: any[]): Promise<T> | null {
    for (const operation of this.operations ?? []) {
      if (operation.key === operationKey && hookKey in operation) {
        return operation[hookKey](...args)
      }
    }
    return null
  }

  /**
   * Allows definitions to use custom refresh credentials logic
   * By default integrations refresh credentials based on their auth type (oauth1, ouath2)
   */
  refreshCredentials(credentials: Record<string, any>): Promise<Record<string, any>> | null {
    return null
  }

  /**
   * Allows definitions to modify the workflow trigger entity before it is created
   */
  async beforeCreateWorkflowTrigger(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    const hookRes = await this._getOperationHookRes<Partial<WorkflowTrigger>>('beforeCreate', integrationTrigger.key, [
      workflowTrigger,
      integrationTrigger,
      accountCredential,
    ])
    if (hookRes) {
      return hookRes
    }
    return workflowTrigger
  }

  /**
   * Allows definitions to modify the workflow trigger entity before it is updated
   */
  async beforeUpdateWorkflowTrigger(
    update: Partial<WorkflowTrigger>,
    prevWorkflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    const hookRes = await this._getOperationHookRes<Partial<WorkflowTrigger>>('beforeUpdate', integrationTrigger.key, [
      update,
      prevWorkflowTrigger,
      integrationTrigger,
      accountCredential,
    ])
    if (hookRes) {
      return hookRes
    }
    return update
  }

  /**
   * Called before a workflow trigger is deleted
   */
  async beforeDeleteWorkflowTrigger(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ) {
    await this._getOperationHookRes('beforeDelete', integrationTrigger.key, [
      workflowTrigger,
      integrationTrigger,
      accountCredential,
    ])
  }

  /**
   * Allows definitions to modify the workflow action entity before it is created
   */
  async beforeCreateWorkflowAction(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> {
    const hookRes = await this._getOperationHookRes<Partial<WorkflowAction>>('beforeCreate', integrationAction.key, [
      workflowAction,
      integrationAction,
      accountCredential,
    ])
    if (hookRes) {
      return hookRes
    }
    return workflowAction
  }

  /**
   * Allows definitions to modify the workflow action entity before it is updated
   */
  async beforeUpdateWorkflowAction(
    update: Partial<WorkflowAction>,
    prevWorkflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> {
    const hookRes = await this._getOperationHookRes<Partial<WorkflowAction>>('beforeUpdate', integrationAction.key, [
      update,
      prevWorkflowAction,
      integrationAction,
      accountCredential,
    ])
    if (hookRes) {
      return hookRes
    }
    return update
  }

  /**
   * Called before a workflow action is deleted
   */
  async beforeDeleteWorkflowAction(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ) {
    await this._getOperationHookRes('beforeDelete', integrationAction.key, [
      workflowAction,
      integrationAction,
      accountCredential,
    ])
  }

  /**
   * Allows definitions to modify the workflow trigger entity after it is created
   */
  async afterCreateWorkflowTrigger(
    workflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
  ) {
    await this._getOperationHookRes('afterCreate', integrationTrigger.key, [
      workflowTrigger,
      integrationTrigger,
      accountCredential,
      update,
    ])
  }

  /**
   * Allows definitions to modify the workflow trigger entity after it is updated
   */
  async afterUpdateWorkflowTrigger(
    workflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
  ) {
    await this._getOperationHookRes('afterUpdate', integrationTrigger.key, [
      workflowTrigger,
      integrationTrigger,
      accountCredential,
      update,
    ])
  }

  /**
   * Called after a workflow trigger is deleted
   */
  async afterDeleteWorkflowTrigger(
    workflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ) {
    await this._getOperationHookRes('afterDelete', integrationTrigger.key, [
      workflowTrigger,
      integrationTrigger,
      accountCredential,
    ])
  }

  /**
   * Allows definitions to modify the workflow action entity after it is created
   */
  async afterCreateWorkflowAction(
    workflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowAction>) => Promise<WorkflowAction>,
  ) {
    await this._getOperationHookRes('afterCreate', integrationAction.key, [
      workflowAction,
      integrationAction,
      accountCredential,
      update,
    ])
  }

  /**
   * Allows definitions to modify the workflow action entity after it is updated
   */
  async afterUpdateWorkflowAction(
    workflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowAction>) => Promise<WorkflowAction>,
  ) {
    await this._getOperationHookRes('afterUpdate', integrationAction.key, [
      workflowAction,
      integrationAction,
      accountCredential,
      update,
    ])
  }

  /**
   * Called after a workflow action is deleted
   */
  async afterDeleteWorkflowAction(
    workflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ) {
    await this._getOperationHookRes('afterDelete', integrationAction.key, [
      workflowAction,
      integrationAction,
      accountCredential,
    ])
  }

  /**
   * Triggered when a hook is received for a specific integration. This hook has to figure it out which triggers should run.
   */
  async onHookReceived(
    req: Request,
    injects: IntegrationHookInjects,
  ): Promise<{
    response: any
    runs: Array<{
      workflowTrigger: WorkflowTrigger
      integrationTrigger: IntegrationTrigger
      outputs: Record<string, any>
    }>
  }> {
    throw new Error(`Hook not supported by this integration`)
  }

  /**
   * Triggered when a hook is received for a specific workflow trigger. Returns true if the hook should continue, false otherwise.
   */
  async onHookReceivedForWorkflowTrigger(
    req: Request,
    opts: OperationRunOptions,
  ): Promise<{ canContinue: boolean; response?: RunResponse }> {
    throw new Error(`Hook not supported by this integration`)
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

  limits(opts: OperationRunOptions): { daily: number } | null {
    for (const operation of this.operations) {
      if (operation.key === opts.operation.key && 'limits' in operation) {
        return (operation as OperationOffChain).limits(opts)
      }
    }
    return null
  }

  /**
   * Allows integrations to entirely replace the run functionality
   * Response is either directly the object with the response or an observable which emits one or more responses
   * Observable responses are only used by triggers
   */
  run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> | null {
    for (const operation of this.operations) {
      if (operation.key === opts.operation.key && 'run' in operation) {
        return (operation as OperationOffChain).run(opts)
      }
    }
    return null
  }

  /**
   * Integrations may need to return custom data to allow users to connect. This method allows to do that.
   */
  async getAccountCreationData(userId: string): Promise<Record<string, any>> {
    return {}
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
  getDynamicSchemaResponseFromRequest(req: Request): JSONSchema7 | null {
    return null // TODO
  }

  /**
   * Operations with dynamic schemas can override this method if their schema is different from the response (e.g. webhook trigger)
   * Currently this is only implemented for hook based triggers
   */
  async getDynamicSchemaOutputs(req: Request): Promise<Record<string, unknown>> {
    return req?.body
  }

  /**
   * Resolves x-asyncSchemas plugin
   * Used to return a set of dynamic options (e.g. discord channels depending on the connected account)
   */
  async getAsyncSchemas(
    operation: IntegrationAction | IntegrationTrigger,
  ): Promise<{ [key: string]: (props: GetAsyncSchemasProps) => Promise<JSONSchema7> }> {
    const defOperation = this.operations.find((op) => op.key === operation.key)
    if (defOperation) {
      return defOperation.getAsyncSchemas(operation)
    }
    return {}
  }

  /**
   * Similar to getAsyncSchemas, but allows to extend the entire schema
   */
  async getAsyncSchemaExtension(
    operation: IntegrationAction | IntegrationTrigger,
    props: GetAsyncSchemasProps,
  ): Promise<JSONSchema7> {
    const defOperation = this.operations.find((op) => op.key === operation.key)
    if (defOperation) {
      return defOperation.getAsyncSchemaExtension(operation, props)
    }
    return {}
  }

  /**
   * Allows definitions to parse the error message before storing it in the operation run
   */
  parseError(e: any) {
    return e.response?.text ?? e.response ?? e.message
  }
}
