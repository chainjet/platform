import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import deepmerge from 'deepmerge'
import { OpenAPIObject, OperationObject, ParameterObject, ReferenceObject, SchemaObject } from 'openapi3-ts'
import { Action, AppPropDefinitions, Methods, UserProp } from 'pipedream/types/src'
import { RunResponse } from '../definition'
import { AsyncSchema } from '../types/AsyncSchema'

export type PipedreamAction = Action<Methods, AppPropDefinitions>

function mapPipedreamTypeToOpenApi(type: UserProp['type']): SchemaObject {
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

export function mapPipedreamActionToOpenApi(action: PipedreamAction): {
  operation: OperationObject
  asyncSchemas: AsyncSchema
} {
  const asyncSchemas: AsyncSchema = []
  const parameters: (ParameterObject | ReferenceObject)[] = Object.entries(action.props ?? {})
    .map(([key, value]) => {
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

      if ('type' in value && value.type === 'app') {
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

      if (value.min) {
        schema.minimum = value.min
      }
      if (value.max) {
        schema.maximum = value.max
      }

      return {
        ...param,
        schema,
      }
    })
    .filter((param) => param !== null) as (ParameterObject | ReferenceObject)[]

  return {
    operation: {
      summary: action.name,
      description: action.description,
      parameters,
      responses: {},
    },
    asyncSchemas,
  }
}

export async function updatePipedreamSchemaBeforeSave(
  schema: OpenAPIObject,
  actions: PipedreamAction[],
): Promise<OpenAPIObject> {
  schema.paths = schema.paths ?? {}
  for (const action of actions) {
    schema.paths['/' + action.key] = schema.paths['/' + action.key] ?? {
      get: {
        operationId: action.key,
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
  actions: PipedreamAction[],
): Promise<OpenAPIObject> {
  for (const action of actions) {
    const actionKey = '/' + action.key
    const schemaOperation = schema.paths[actionKey].get
    if (schemaOperation.summary === '') {
      delete schemaOperation.summary
    }

    const operationData = mapPipedreamActionToOpenApi(action)
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

    schema.paths[actionKey].get = deepmerge(operationData.operation, schemaOperation)
    schema.paths[actionKey].get.parameters = mergedParams

    if (operationData.asyncSchemas.length) {
      schema.paths[actionKey].get['x-asyncSchemas'] = schema.paths[actionKey].get['x-asyncSchemas'] ?? []
      schema.paths[actionKey].get['x-asyncSchemas'].push(...operationData.asyncSchemas)
    }
  }
  return schema
}

export async function runPipedreamAction(action: PipedreamAction, opts: OperationRunOptions): Promise<RunResponse> {
  const appData = Object.entries(action.props ?? {}).find(([_, prop]) => 'type' in prop && prop.type === 'app')
  if (!appData) {
    throw new Error(`Action ${opts.operation.key} is not configured correctly for integration ${opts.integration.key}`)
  }

  // TODO this only works for oauth2
  const $auth = { oauth_access_token: opts.credentials.accessToken }

  const [appKey, app] = appData
  const appMethods = 'methods' in app ? { ...app.methods, $auth } : {}
  const bindData = {
    ...opts.inputs,
    [appKey]: appMethods,
  }

  // TODO handle exports
  const $ = {
    export: (key: string, value: string) => {
      console.log(`Export =>`, key, value)
    },
  }

  const outputs = await action.run.bind(bindData)({ $ })
  return {
    outputs,
  }
}
