import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import deepmerge from 'deepmerge'
import fs from 'fs'
import { OpenAPIObject, OperationObject, ParameterObject, ReferenceObject, SchemaObject } from 'openapi3-ts'
import path from 'path'
import {
  Action,
  AppPropDefinitions,
  DataStoreProp,
  EmitMetadata,
  HttpRequestProp,
  InterfaceProp,
  JSONValue,
  Methods,
  ServiceDBProp,
  Source,
  SourcePropDefinitions,
  UserProp,
} from 'pipedream/types/src'
import { Observable } from 'rxjs'
import { RunResponse } from '../definition'
import { AsyncSchema } from '../types/AsyncSchema'

export type PipedreamAction = Action<Methods, AppPropDefinitions>
export type PipedreamSource = Source<Methods, SourcePropDefinitions>
export type PipedreamOperation = PipedreamAction | PipedreamSource

type PropType =
  | UserProp['type']
  | InterfaceProp['type']
  | ServiceDBProp['type']
  | DataStoreProp['type']
  | HttpRequestProp['type']

type OperationGetter = (type: string, key: string) => Promise<PipedreamOperation>

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
        properties: {}, // TODO
      }
    default:
      return {
        type: 'string',
      }
  }
}

export function mapPipedreamOperationToOpenApi(operation: PipedreamOperation): {
  operation: OperationObject
  asyncSchemas: AsyncSchema
} {
  const asyncSchemas: AsyncSchema = []
  const parameters: (ParameterObject | ReferenceObject)[] = Object.entries(operation.props ?? {})
    .map(([key, value]) => {
      if (typeof value !== 'object') {
        return null
      }

      if ('propDefinition' in value) {
        if (value.propDefinition.length >= 2) {
          value = {
            ...value.propDefinition[0].propDefinitions![value.propDefinition[1]],
            ...value,
          }
        }
      }

      if (!('type' in value)) {
        throw new Error(`property without a type on key ${key}`)
      }

      if (value.type === 'app' || value.type.startsWith('$') || value.type === 'http_request') {
        return null
      }

      const param: ParameterObject = {
        name: key,
        in: 'query',
        required: !(value as { optional: boolean }).optional,
      }
      const schema: SchemaObject = mapPipedreamTypeToOpenApi(value.type)

      if ('label' in value && value.label) {
        param['x-label'] = value.label
      }

      if ('description' in value && value.description) {
        param.description = value.description
      }

      if ('default' in value && value.default) {
        schema.default = value.default
      }

      if ('secret' in value && value.secret) {
        // TODO https://trello.com/c/11fTX1dC/6-encrypted-secret-params
      }

      if ('min' in value && value.min) {
        schema.minimum = value.min
      }
      if ('max' in value && value.max) {
        schema.maximum = value.max
      }

      if ('options' in value && value.options) {
        if (Array.isArray(value.options)) {
          // if the options are all strings, we can use enum, otherwise we need to use oneOf
          if (value.options.every((option) => typeof option === 'string')) {
            schema.enum = value.options
          } else {
            schema.oneOf = value.options.map((option) => ({
              title: option.label,
              'x-const': option.value,
            }))
          }
        } else {
          asyncSchemas.push({
            name: key,
          })
        }
      }

      return {
        ...param,
        schema,
      }
    })
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

export async function updatePipedreamSchemaBeforeSave(
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

export async function updatePipedreamSchemaBeforeInstall(
  schema: OpenAPIObject,
  operations: PipedreamOperation[],
): Promise<OpenAPIObject> {
  for (const operation of operations) {
    const actionKey = '/' + operation.key
    const schemaOperation = schema.paths[actionKey].get
    if (schemaOperation.summary === '') {
      delete schemaOperation.summary
    }

    if (operation.name?.toLowerCase().includes('instant')) {
      throw new Error(`Instant operations not supported yet`)
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

    schema.paths[actionKey].get = deepmerge(operationData.operation, schemaOperation)
    schema.paths[actionKey].get.parameters = mergedParams

    if (operationData.asyncSchemas.length) {
      schema.paths[actionKey].get['x-asyncSchemas'] = schema.paths[actionKey].get['x-asyncSchemas'] ?? []
      schema.paths[actionKey].get['x-asyncSchemas'].push(...operationData.asyncSchemas)
    }
  }
  return schema
}

export async function runPipedreamOperation(
  operation: PipedreamOperation,
  opts: OperationRunOptions,
): Promise<RunResponse | Observable<RunResponse>> {
  const appData = Object.entries(operation.props ?? {}).find(([_, prop]) => 'type' in prop && prop.type === 'app')
  if (!appData) {
    throw new Error(`Action ${opts.operation.key} is not configured correctly for integration ${opts.integration.key}`)
  }

  const $auth = {
    oauth_access_token: opts.credentials.accessToken,
    oauth_refresh_token: opts.credentials.refreshToken,
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

  const bindData: Record<string, any> = {
    ...opts.inputs,
    [appKey]: appMethods, // include methods defined at app level
    ...operation.methods, // include methods defined at operation level
    ...opts.accountCredential,
  }

  if (operation.type === 'action') {
    for (const key of Object.keys(operation.methods ?? {})) {
      operation.methods![key] = operation.methods![key].bind(bindData)
      bindData[key] = operation.methods![key]
    }

    // TODO handle exports
    const $ = {
      export: (key: string, value: string) => {
        console.log(`Export =>`, key, value)
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

export async function getPipedreamOperations(
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
