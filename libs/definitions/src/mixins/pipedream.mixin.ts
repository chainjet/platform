import { isEmptyObj } from '@app/common/utils/object.utils'
import { SecurityUtils } from '@app/common/utils/security.utils'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import deepmerge from 'deepmerge'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import fs from 'fs'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject, OperationObject, ParameterObject, ReferenceObject, SchemaObject } from 'openapi3-ts'
import path from 'path'
import {
  Action,
  App,
  AppPropDefinitions,
  DataStoreProp,
  EmitMetadata,
  HttpRequestProp,
  InterfaceProp,
  JSONValue,
  Methods,
  PropDefinition,
  PropDefinitionReference,
  ServiceDBProp,
  Source,
  SourcePropDefinitions,
  UserProp,
} from 'pipedream/types/src'
import { ParsedQs } from 'qs'
import { Observable } from 'rxjs'
import { GetAsyncSchemasProps, RunResponse, SingleIntegrationData } from '../definition'
import { parseJsonSchemaValue } from '../schema/utils/jsonSchemaUtils'
import { AsyncSchema } from '../types/AsyncSchema'

type PipedreamAction = Action<Methods, AppPropDefinitions>
type PipedreamSource = Source<Methods, SourcePropDefinitions>
type PipedreamOperation = PipedreamAction | PipedreamSource

type PipedreaProp =
  | PropDefinitionReference
  | App<Methods, AppPropDefinitions>
  | UserProp
  | DataStoreProp
  | InterfaceProp
  | ServiceDBProp
  | HttpRequestProp

type PropType =
  | UserProp['type']
  | InterfaceProp['type']
  | ServiceDBProp['type']
  | DataStoreProp['type']
  | HttpRequestProp['type']

type OperationGetter = (type: string, key: string) => Promise<PipedreamOperation>

type AbstractConstructor<T> = abstract new (...args: any[]) => T

export function PipedreamMixin<T extends AbstractConstructor<SingleIntegrationData>>(Base: T) {
  abstract class _PipedreamMixin extends Base {
    abstract pipedreamKey: string
    operations: PipedreamOperation[]

    abstract getOperation(type: string, key: string): Promise<PipedreamOperation>

    async beforeCreateWorkflowTrigger(
      workflowTrigger: WorkflowTrigger,
      integrationTrigger: IntegrationTrigger,
      accountCredential: AccountCredential | null,
    ): Promise<WorkflowTrigger> {
      return await runPipedreamBeforeCreateWorkflowTrigger(
        this.integrationKey,
        await this.getOperations(),
        workflowTrigger,
        integrationTrigger,
        accountCredential,
      )
    }

    // TODO run before update
    async afterUpdateWorkflowTrigger(
      workflowTrigger: WorkflowTrigger,
      integrationTrigger: IntegrationTrigger,
      accountCredential: AccountCredential | null,
      update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
    ) {
      await runPipedreamAfterUpdateWorkflowTrigger(
        this.integrationKey,
        await this.getOperations(),
        workflowTrigger,
        integrationTrigger,
        accountCredential,
        update,
      )
    }

    // TODO run before delete
    async afterDeleteWorkflowTrigger(
      workflowTrigger: WorkflowTrigger,
      integrationTrigger: IntegrationTrigger,
      accountCredential: AccountCredential | null,
    ) {
      await runPipedreamAfterDeleteWorkflowTrigger(
        this.integrationKey,
        await this.getOperations(),
        workflowTrigger,
        integrationTrigger,
        accountCredential,
      )
    }

    async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
      const operations = await this.getOperations()
      return updatePipedreamSchemaBeforeSave(schema, operations)
    }

    async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
      const operations = await this.getOperations()
      return updatePipedreamSchemaBeforeInstall(schema, operations)
    }

    async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> {
      const operations = await this.getOperations()
      const operation = operations.find((a) => a.key === opts.operation.key)
      if (operation) {
        return runPipedreamOperation(this.integrationKey, operation, opts)
      }
      return null
    }

    // TODO
    async onHookReceivedForWorkflowTrigger(
      req: Request<ParamsDictionary, any, any, ParsedQs>,
      opts: OperationRunOptions,
    ): Promise<boolean> {
      const operations = await this.getOperations()
      const operation = operations.find((a) => a.key === opts.operation.key)
      if (operation) {
        console.log(`Workflow received for operation:`, operation.key)
        await runPipedreamOperation(this.integrationKey, operation, opts)
      }
      return false
    }

    async getAsyncSchemas(operation: IntegrationAction | IntegrationTrigger) {
      return getAsyncSchemasForPipedream(this.integrationKey, await this.getOperations(), operation)
    }

    async getAdditionalAsyncSchema(
      operation: IntegrationAction | IntegrationTrigger,
      props: GetAsyncSchemasProps,
    ): Promise<{ [key: string]: JSONSchema7 }> {
      const operations = await this.getOperations()
      const pipedreamOperation = operations.find((a) => a.key === operation.key)
      if (!pipedreamOperation) {
        throw new Error(`Operation ${operation.key} not found`)
      }
      if (!pipedreamOperation.additionalProps) {
        return {}
      }

      const { bindData } = getBindData(this.integrationKey, pipedreamOperation, props)
      const additionalProps = await pipedreamOperation.additionalProps.bind(bindData)({})

      const additionalSchemas = {}
      for (const [key, value] of Object.entries(additionalProps)) {
        const schemaProp = mapPipedreamPropertyToJsonSchemaParam(key, value as PipedreaProp)
        if (schemaProp && 'schema' in schemaProp) {
          additionalSchemas[key] = schemaProp.schema
        }
      }

      return additionalSchemas
    }

    async getOperations(): Promise<PipedreamOperation[]> {
      if (!this.operations) {
        this.operations = await getPipedreamOperations(this.pipedreamKey, this.getOperation)
      }
      return this.operations
    }
  }

  return _PipedreamMixin
}

function mapPipedreamTypeToOpenApi(type: PropType): SchemaObject {
  if (type.endsWith('[]')) {
    return { type: 'array', items: mapPipedreamTypeToOpenApi(type.slice(0, -2) as UserProp['type']) }
  }
  switch (type) {
    case 'string':
      return {
        type: 'string',
      }
    case 'boolean':
      return {
        type: 'boolean',
      }
    case 'integer':
      return {
        type: 'integer',
      }
    case 'object':
      return {
        type: 'object',
        additionalProperties: true,
        properties: {},
      }
    default:
      return {
        type: 'string',
      }
  }
}

function mapPipedreamOperationToOpenApi(operation: PipedreamOperation): {
  operation: OperationObject
  asyncSchemas: AsyncSchema[]
} {
  const asyncSchemas: AsyncSchema[] = []
  const parameters: (ParameterObject | ReferenceObject)[] = Object.entries(operation.props ?? {})
    .map(([key, value]) => mapPipedreamPropertyToJsonSchemaParam(key, value, asyncSchemas))
    .filter((param) => param !== null) as (ParameterObject | ReferenceObject)[]

  return {
    operation: {
      summary: operation.name,
      description: operation.description,
      parameters,
      responses: {},
    },
    asyncSchemas,
  }
}

function mapPipedreamPropertyToJsonSchemaParam(
  key: string,
  prop: PipedreaProp,
  asyncSchemas: AsyncSchema[] = [],
): ParameterObject | ReferenceObject | null {
  if (typeof prop !== 'object') {
    return null
  }

  let propDefinition: PropDefinition | null = null
  if ('propDefinition' in prop) {
    propDefinition = prop.propDefinition
    if (prop.propDefinition.length >= 2) {
      prop = {
        ...prop.propDefinition[0].propDefinitions![prop.propDefinition[1]],
        ...prop,
      }
    }
  }

  if (!('type' in prop)) {
    throw new Error(`property without a type on key ${key}`)
  }

  if (prop.type === 'app' || prop.type.startsWith('$') || prop.type === 'http_request') {
    return null
  }

  const param: ParameterObject = {
    name: key,
    in: 'query',
    required: !(prop as { optional: boolean }).optional,
  }
  const schema: SchemaObject = mapPipedreamTypeToOpenApi(prop.type)

  if ('label' in prop && prop.label) {
    schema.title = prop.label
  }

  if ('description' in prop && prop.description) {
    param.description = prop.description?.replace(/pipedream/gi, 'ChainJet')
  }

  if ('default' in prop && prop.default) {
    schema.default = prop.default
  }

  if ('secret' in prop && prop.secret) {
    // TODO https://trello.com/c/11fTX1dC/6-encrypted-secret-params
  }

  if ('min' in prop && prop.min) {
    schema.minimum = prop.min
  }
  if ('max' in prop && prop.max) {
    schema.maximum = prop.max
  }

  if ('options' in prop && prop.options) {
    if (Array.isArray(prop.options)) {
      // if the options are all strings, we can use enum, otherwise we need to use oneOf
      if (prop.options.every((option) => typeof option === 'string')) {
        if (schema.type === 'array') {
          ;(schema.items as SchemaObject).enum = prop.options
        } else {
          schema.enum = prop.options
        }
      } else if (schema.type === 'array') {
        ;(schema.items as SchemaObject).oneOf = prop.options.map((option) => ({
          title: option.label,
          const: option.value,
        }))
      } else {
        schema.oneOf = prop.options.map((option) => ({
          title: option.label,
          const: option.value,
        }))
      }
    } else if (typeof prop.options === 'function') {
      // The third argument of propDefinition has the dependencies of the async schema
      if (propDefinition?.length === 3) {
        asyncSchemas.push({
          name: key,
          // we can't use the keys as dependencies because the name can change (e.g. google_sheets-add-single-row drive => driveId)
          // with any: true we refresh for every change to any dependency
          // dependencies: Object.keys(propDefinition[2]({})),
          any: true,
        })
      } else {
        asyncSchemas.push({
          name: key,
        })
      }
    } else {
      throw new Error(`Unknown options value for ${key}`)
    }
  }

  return {
    ...param,
    schema,
  }
}

async function updatePipedreamSchemaBeforeSave(
  schema: OpenAPIObject,
  operations: PipedreamOperation[],
): Promise<OpenAPIObject> {
  schema.paths = schema.paths ?? {}
  for (const operation of operations) {
    schema.paths['/' + operation.key] = schema.paths['/' + operation.key] ?? {
      get: {
        operationId: operation.key,

        // Components without a type are considered sources
        [operation.type === 'action' ? 'x-actionOnly' : 'x-triggerOnly']: true,

        'x-learnResponseWorkflow': true,
        summary: '',
        responses: {
          '200': {
            description: '',
            content: {
              'application/json': {
                schema: {},
              },
            },
          },
        },
      },
    }
  }
  return schema
}

async function updatePipedreamSchemaBeforeInstall(
  schema: OpenAPIObject,
  operations: PipedreamOperation[],
): Promise<OpenAPIObject> {
  for (const operation of operations) {
    const actionKey = '/' + operation.key
    const schemaOperation = schema.paths[actionKey].get
    if (schemaOperation.summary === '') {
      delete schemaOperation.summary
    }

    const operationData = mapPipedreamOperationToOpenApi(operation)
    const schemaParams = schemaOperation.parameters ?? []

    // parameters are merged by name to avoid duplicates
    const mergedParams = (operationData.operation.parameters ?? []).reduce((prev, curr, i) => {
      const schemaParam = 'name' in curr && schemaParams.find((param) => param?.name === curr.name)
      if (schemaParam) {
        return [...prev.slice(0, i), deepmerge(curr, schemaParam), ...prev.slice(i + 1)]
      }
      return [...prev, curr]
    }, [])
    for (const param of schemaParams) {
      if (!mergedParams.find((p) => (p as any)?.name === param.name)) {
        mergedParams.push(param)
      }
    }

    operationData.operation['x-triggerIdKey'] = 'items[].id'

    if (operation.name?.toLowerCase().includes('(instant)')) {
      operationData.operation['x-triggerInstant'] = true
      operationData.operation.summary = operationData.operation.summary?.replace(/\(instant\)/i, '').trim()
    }

    // update trigger descriptions
    const descriptionReplacements = {
      'Emit new event each time': 'Triggers when',
      'Emits a new event any time': 'Triggers when',
      'Emit new event for': 'Triggers for',
      'Emit new event when': 'Triggers when',
      'Emit new event on each': 'Triggers on each',
    }
    for (const [key, value] of Object.entries(descriptionReplacements)) {
      operationData.operation.description = operationData.operation.description?.replace(key, value)
    }

    schema.paths[actionKey].get = deepmerge(operationData.operation, schemaOperation)
    schema.paths[actionKey].get.parameters = mergedParams

    if (operationData.asyncSchemas.length) {
      schema.paths[actionKey].get['x-asyncSchemas'] = schema.paths[actionKey].get['x-asyncSchemas'] ?? []
      schema.paths[actionKey].get['x-asyncSchemas'].push(...operationData.asyncSchemas)
    }
  }
  return schema
}

function getBindData(
  integrationKey: string,
  operation: PipedreamOperation,
  opts: {
    operation: IntegrationAction | IntegrationTrigger
    workflowOperation?: WorkflowAction | WorkflowTrigger
    inputs: Record<string, any>
    credentials: Record<string, any>
    accountCredential: AccountCredential | null
  },
  req?: any, // TODO
): { bindData: Record<string, any>; hookId?: string } {
  const propEntries = Object.entries(operation.props ?? {})
  const appData = propEntries.find(([_, prop]) => typeof prop === 'object' && 'type' in prop && prop.type === 'app')
  if (!appData) {
    throw new Error(
      `Action ${opts.operation.key} is not configured correctly for integration ${opts.operation.integration.id}`,
    )
  }

  const $auth = {
    oauth_access_token: opts.credentials.accessToken,
    oauth_refresh_token: opts.credentials.refreshToken,
    oauth_signer_uri: `${process.env.API_ENDPOINT}/account-credentials/oauth1-sign/${integrationKey}`,
    ...opts.credentials,
  }

  const [appKey, app] = appData
  const appMethods = 'methods' in app ? { ...app.methods, $auth } : {}

  if ('_getHeaders' in appMethods) {
    const headers = (appMethods as Methods)._getHeaders() as object
    const userAgentKey = Object.keys(headers).find((key) => key.toLowerCase() === 'user-agent')
    if (userAgentKey) {
      delete headers[userAgentKey]
    }
    ;(appMethods as Methods)._getHeaders = function () {
      return {
        ...headers,
        [userAgentKey ?? 'User-Agent']: 'ChainJet.io - admin@chainjet.io',
      }
    }.bind(appMethods)
  }

  const httpProp = propEntries.find(
    ([_, prop]) => typeof prop === 'object' && 'type' in prop && prop.type === '$.interface.http',
  )
  const httpInterface = {}
  let hookId: string | undefined
  if (httpProp) {
    hookId =
      opts.workflowOperation && 'hookId' in opts.workflowOperation
        ? opts.workflowOperation.hookId
        : SecurityUtils.generateRandomString(48)
    httpInterface[httpProp[0]] = {
      endpoint: `${process.env.API_ENDPOINT}/hooks/${hookId}`,
      respond: (...args) => {
        console.log(`== RESPOND ==`, ...args) // TODO
      },
    }
  }

  return {
    bindData: {
      ...appMethods,
      ...opts.inputs,
      [appKey]: appMethods, // include methods defined at app level
      ...operation.methods, // include methods defined at operation level
      ...httpInterface,
      ...opts.accountCredential,
    },
    hookId,
  }
}

async function runPipedreamOperation(
  integrationKey: string,
  operation: PipedreamOperation,
  opts: OperationRunOptions,
): Promise<RunResponse | Observable<RunResponse>> {
  operation = {
    ...operation,
    methods: {
      ...operation.methods,
    },
  }

  const { bindData } = getBindData(integrationKey, operation, opts)

  if (operation.type === 'action') {
    for (const key of Object.keys(operation.methods ?? {})) {
      operation.methods![key] = operation.methods![key].bind(bindData)
      bindData[key] = operation.methods![key]
    }

    // TODO handle exports
    const $ = {
      export: (key: string, value: string) => {
        // console.log(`Export =>`, key, value)
      },
    }

    const outputs = await operation.run.bind(bindData)({ $ })
    return {
      outputs,
    }
  } else {
    return new Observable((subscriber) => {
      // use a temporary store instead of writing directly on the workflow operation, because we don't want to save it in case of failure
      const tempStore = {
        ...(opts.workflowOperation?.store ?? {}),
      }

      const $emit: (event: JSONValue, metadata: EmitMetadata) => Promise<void> = async (
        event: JSONValue,
        metadata: EmitMetadata,
      ) => {
        if (!event) {
          return
        }
        if (typeof event !== 'object') {
          throw new Error(`Non object events not supported yet`)
        }
        if (Array.isArray(event)) {
          throw new Error(`Array events not supported yet`)
        }
        if (!metadata.id) {
          throw new Error(`Events without id not supported yet`)
        }
        subscriber.next({
          outputs: {
            id: metadata.id.toString(),
            ...event,
          },
          store: tempStore,
        })
      }
      bindData['$emit'] = $emit

      // use the store in the workflowOperation as db
      bindData.db = {
        get: (key: string) => tempStore[key],
        set: (key: string, value: any) => {
          tempStore[key] = value
        },
      }

      for (const key of Object.keys(operation.methods ?? {})) {
        operation.methods![key] = operation.methods![key].bind(bindData)
        bindData[key] = operation.methods![key]
      }

      const event = {
        timestamp: new Date(),
      }

      operation.run
        .bind(bindData)(event)
        .then(() => {
          subscriber.complete()
        })
        .catch((e: Error) => {
          subscriber.error(e)
        })
    })
  }
}

async function getPipedreamOperationKeys(componentKey: string): Promise<{ key: string; type: string }[]> {
  const componentRootPath = `dist/pipedream/components/${componentKey}`
  const actionsPath = path.join(componentRootPath, 'actions')
  const actionKeys = (await fs.promises.readdir(actionsPath)).filter((key) => !key.includes('.'))
  const sourcesPath = path.join(componentRootPath, 'sources')
  const sourceKeys = (await fs.promises.readdir(sourcesPath)).filter((key) => !key.includes('.'))
  const operationKeys = [
    ...actionKeys.map((key) => ({ key, type: 'actions' })),
    ...sourceKeys.map((key) => ({ key, type: 'sources' })),
  ]

  // check if files for all the keys exist
  const nonExistentKeys: string[] = []
  for (const { key, type } of operationKeys) {
    const filePath = path.join(type === 'actions' ? actionsPath : sourcesPath, key, key + '.mjs')
    try {
      await fs.promises.access(filePath, fs.constants.R_OK | fs.constants.W_OK)
    } catch {
      nonExistentKeys.push(key)
    }
  }

  return operationKeys.filter(({ key }) => !nonExistentKeys.includes(key))
}

async function getPipedreamOperations(
  integrationKey: string,
  opGetter: OperationGetter,
): Promise<PipedreamOperation[]> {
  const operationKeys = await getPipedreamOperationKeys(integrationKey)
  const operations: PipedreamOperation[] = []
  for (const { type, key } of operationKeys) {
    operations.push(await opGetter(type, key))
  }
  return operations
}

function getAsyncSchemasForPipedream(
  integrationKey: string,
  operations: PipedreamOperation[],
  integrationOperation: IntegrationAction | IntegrationTrigger,
) {
  const asyncSchemas: AsyncSchema[] = integrationOperation.schemaRequest?.['x-asyncSchemas']
  return asyncSchemas.reduce((acc, curr) => {
    acc[curr.name] = async (props: GetAsyncSchemasProps) => {
      // check all dependencies for the async schema have been provided
      // these are only the dependencies on x-asyncSchemas, pipedream also requires all the keys on the option object to be defined
      const unmetDependencies = curr.dependencies?.some((dep) => !props.inputs[dep])
      if (curr.dependencies?.length && unmetDependencies) {
        return {}
      }

      const pipedreamOperation = operations.find((a) => a.key === props.operation.key)
      if (!pipedreamOperation) {
        throw new Error(`Operation ${props.operation.key} not found for integration ${props.integration.key}`)
      }
      let pipedreamProp = pipedreamOperation.props![curr.name] ?? {}
      let propInputs = {}
      if ('propDefinition' in pipedreamProp) {
        if (pipedreamProp.propDefinition.length >= 2) {
          // the third parameter of the prop definition defines the dependency inputs for the options
          propInputs = pipedreamProp.propDefinition[2]?.(props.inputs) ?? {}
          pipedreamProp = {
            ...pipedreamProp.propDefinition[0].propDefinitions![pipedreamProp.propDefinition[1]],
            ...pipedreamProp,
          }
        }
      }
      if ('options' in pipedreamProp && typeof pipedreamProp.options === 'function') {
        // if any of the inputs is undefined, means that pipedream dependencies are not met
        const hasUndefinedInputs = Object.keys(propInputs).some((key) => propInputs[key] === undefined)
        if (hasUndefinedInputs) {
          return {}
        }

        const { bindData } = getBindData(integrationKey, pipedreamOperation, { ...props, inputs: propInputs })
        let items = await pipedreamProp.options.bind(bindData)({ page: 0, prevContext: {}, ...propInputs })

        // items can be an array or an object where the options keys hold the items array
        if ('options' in items) {
          items = items.options
        }

        // make sure items is a non-empty array
        if (!Array.isArray(items) || !items.length) {
          return {}
        }

        const propSchema = integrationOperation.schemaRequest.properties?.[curr.name] ?? {}

        const defaultValue = parseJsonSchemaValue(propSchema, items[0].value)

        // items can be an array of strings or an array of { label: string, value: any }
        if (items.every((item) => typeof item === 'string')) {
          return {
            default: defaultValue,
            enum: items,
          }
        }

        return {
          default: defaultValue,
          oneOf: items.map((item) => ({
            title: item.label,
            const: parseJsonSchemaValue(propSchema, item.value),
          })),
        }
      }
      return {}
    }
    return acc
  }, {})
}

async function runPipedreamBeforeCreateWorkflowTrigger(
  integrationKey: string,
  operations: PipedreamOperation[],
  workflowTrigger: WorkflowTrigger,
  integrationTrigger: IntegrationTrigger,
  accountCredential: AccountCredential | null,
): Promise<WorkflowTrigger> {
  let operation = operations.find(
    (operation) => operation.type === 'source' && operation.key === integrationTrigger.key,
  ) as PipedreamSource
  if (operation) {
    operation = {
      ...operation,
      methods: {
        ...operation.methods,
      },
    }

    const { bindData, hookId } = getBindData(integrationKey, operation, {
      operation: integrationTrigger,
      workflowOperation: workflowTrigger,
      inputs: workflowTrigger.inputs ?? {},
      credentials: accountCredential?.credentials ?? {},
      accountCredential,
    })

    for (const key of Object.keys(operation.methods ?? {})) {
      operation.methods![key] = operation.methods![key].bind(bindData)
      bindData[key] = operation.methods![key]
    }
    bindData['$emit'] = () => {}

    const tempStore = {}
    bindData.db = {
      get: (key: string) => tempStore[key],
      set: (key: string, value: any) => {
        tempStore[key] = value
      },
    }
    if (hookId) {
      workflowTrigger.hookId = hookId
    }
    if (operation.hooks?.deploy) {
      await operation.hooks.deploy.bind(bindData)()
    }
    if (operation.hooks?.activate) {
      await operation.hooks.activate.bind(bindData)()
    }
    if (!isEmptyObj(tempStore)) {
      workflowTrigger.store = tempStore
    }
  }
  return workflowTrigger
}

async function runPipedreamAfterUpdateWorkflowTrigger(
  integrationKey: string,
  operations: PipedreamOperation[],
  workflowTrigger: WorkflowTrigger,
  integrationTrigger: IntegrationTrigger,
  accountCredential: AccountCredential | null,
  update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
) {
  let operation = operations.find(
    (operation) => operation.type === 'source' && operation.key === integrationTrigger.key,
  ) as PipedreamSource
  if (operation && operation.hooks?.activate) {
    operation = {
      ...operation,
      methods: {
        ...operation.methods,
      },
    }

    const { bindData } = getBindData(integrationKey, operation, {
      operation: integrationTrigger,
      workflowOperation: workflowTrigger,
      inputs: workflowTrigger.inputs ?? {},
      credentials: accountCredential?.credentials ?? {},
      accountCredential,
    })

    for (const key of Object.keys(operation.methods ?? {})) {
      operation.methods![key] = operation.methods![key].bind(bindData)
      bindData[key] = operation.methods![key]
    }
    bindData['$emit'] = () => {}

    const tempStore = {
      ...(workflowTrigger?.store ?? {}),
    }
    bindData.db = {
      get: (key: string) => tempStore[key],
      set: (key: string, value: any) => {
        tempStore[key] = value
      },
    }
    await operation.hooks!.activate!.bind(bindData)()
    await update({ store: tempStore }) // TODO only if workflowTrigger.store != tempStore
  }
}

async function runPipedreamAfterDeleteWorkflowTrigger(
  integrationKey: string,
  operations: PipedreamOperation[],
  workflowTrigger: WorkflowTrigger,
  integrationTrigger: IntegrationTrigger,
  accountCredential: AccountCredential | null,
) {
  let operation = operations.find(
    (operation) => operation.type === 'source' && operation.key === integrationTrigger.key,
  ) as PipedreamSource
  if (operation && operation.hooks?.deactivate) {
    operation = {
      ...operation,
      methods: {
        ...operation.methods,
      },
    }

    const { bindData } = getBindData(integrationKey, operation, {
      operation: integrationTrigger,
      workflowOperation: workflowTrigger,
      inputs: workflowTrigger.inputs ?? {},
      credentials: accountCredential?.credentials ?? {},
      accountCredential,
    })

    for (const key of Object.keys(operation.methods ?? {})) {
      operation.methods![key] = operation.methods![key].bind(bindData)
      bindData[key] = operation.methods![key]
    }
    bindData['$emit'] = () => {}

    const tempStore = {
      ...(workflowTrigger?.store ?? {}),
    }
    bindData.db = {
      get: (key: string) => tempStore[key],
      set: (key: string, value: any) => {
        tempStore[key] = value
      },
    }
    await operation.hooks!.deactivate!.bind(bindData)()
  }
}
