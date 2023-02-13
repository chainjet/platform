// Ported from https://github.com/mikunn/openapi2schema/blob/master/lib/openapi2schema.js

import $RefParser from '@apidevtools/json-schema-ref-parser'
import { decycle } from '@app/common/utils/json.utils'
import { Logger } from '@nestjs/common'
import toJsonSchema, { fromParameter } from '@openapi-contrib/openapi-schema-to-json-schema'
import { JSONSchema7 } from 'json-schema'
import mergeAllOf, { Options as MergeAllOfOptions } from 'json-schema-merge-allof'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'
import { PathsObject } from 'openapi3-ts/src/model/OpenApi'
import { isEmptyObj } from '../../../../common/src/utils/object.utils'
import { prepareInputsJsonSchema, transformDynamicRefExtension } from './jsonSchemaUtils'

interface OpenApi2SchemaOptions {
  dateToDateTime?: boolean
  supportPatternProperties?: boolean
}

type NotSupported =
  | 'nullable'
  | 'discriminator'
  | 'readOnly'
  | 'writeOnly'
  | 'xml'
  | 'externalDocs'
  | 'example'
  | 'deprecated'

interface SchemaOptions extends OpenApi2SchemaOptions {
  keepNotSupported?: NotSupported[]
}

interface ToJsonSchemaOptions extends SchemaOptions {
  removeWriteOnly?: boolean
  removeReadOnly?: boolean
}

export interface ConvertedJsonSchemaOperation {
  request?: JSONSchema7
  responses?: Record<string, JSONSchema7>
}
type ConvertedJsonSchema = Record<string, Record<string, ConvertedJsonSchemaOperation>>

const logger = new Logger('openapi2schema')

const mergeAllOfOptions: MergeAllOfOptions = {
  resolvers: {
    // default resolver will catch any unknown keyword on the OpenAPI properties
    defaultResolver: () => '',
  },
}

export async function openapi2schema(
  spec: OpenAPIObject,
  options: OpenApi2SchemaOptions = {},
): Promise<ConvertedJsonSchema> {
  logger.debug('Converting OpenAPI3 to JSON Schema')

  const schemaOptions: SchemaOptions = {
    dateToDateTime: !!options.dateToDateTime,
    supportPatternProperties: !!options.supportPatternProperties,

    // keep deprecated value, so we can detect and remove deprecated propertise
    keepNotSupported: ['deprecated'],
  }

  // $RefParser.dereference takes the file path of an OpenAPI3 schema and returns an object with all the $ref pointers
  // replaced with its value
  const dereferenced: any = await $RefParser.dereference(spec)
  if (!dereferenced.paths) {
    throw new Error('no paths defined in the specification file')
  }

  const result = buildPaths(dereferenced.paths, options, schemaOptions)
  logger.debug('OpenAPI3 successfully converted to JSON Schema')
  return result
}

function buildPaths(
  paths: PathsObject,
  options: OpenApi2SchemaOptions,
  schemaOptions: SchemaOptions,
): ConvertedJsonSchema {
  const result: ConvertedJsonSchema = {}

  for (const [pathKey, pathSpec] of Object.entries(paths)) {
    result[pathKey] = {}

    const pathEntries = Object.entries(pathSpec as Record<string, OperationObject>).filter((entry) =>
      ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(entry[0]),
    )
    for (const [operationKey, operationSpec] of pathEntries) {
      const resultSchema: ConvertedJsonSchemaOperation = {}
      if (operationSpec.requestBody) {
        resultSchema.request = getConvertedSchema('request', operationSpec.requestBody, schemaOptions)
      }
      resultSchema.request = {
        type: 'object',
        required: [],
        properties: {},
        ...resultSchema.request,
      }

      // Merge properties defined on the path with properties defined on the method.
      operationSpec.parameters = [...(operationSpec.parameters ?? []), ...(pathSpec.parameters ?? [])]

      if (operationSpec.parameters?.length) {
        resultSchema.request = appendParameters(resultSchema.request, operationSpec, schemaOptions)
      }

      resultSchema.request = prepareInputsJsonSchema(resultSchema.request)

      if (operationSpec.responses) {
        resultSchema.responses = buildResponses(operationSpec.responses, schemaOptions)
      }

      if (!isEmptyObj(resultSchema)) {
        result[pathKey][operationKey] = resultSchema
      }
    }

    if (isEmptyObj(result[pathKey])) {
      delete result[pathKey]
    }
  }

  return result
}

function buildResponses(responses: any, schemaOptions: SchemaOptions): Record<string, any> {
  const resultResponses: Record<string, any> = {}

  for (const [statusCode, responseData] of Object.entries(responses)) {
    resultResponses[statusCode] = getConvertedSchema('response', responseData, schemaOptions)
  }

  return resultResponses
}

function getConvertedSchema(type: 'request' | 'response', spec: any, schemaOptions: SchemaOptions): JSONSchema7 {
  const options: ToJsonSchemaOptions = { ...schemaOptions }

  let contentType: string
  if (spec.content?.['application/json']) {
    contentType = 'application/json'
  } else if (spec.content && Object.keys(spec.content).length) {
    contentType = Object.keys(spec.content)[0]
  } else {
    return {}
  }

  let schema = spec.content[contentType].schema ?? {}

  // Detect circular dependencies and replace them with a special key
  try {
    schema = JSON.parse(JSON.stringify(schema))
  } catch (e) {
    schema = decycle(schema)
  }

  schema = mergeAllOf(schema, mergeAllOfOptions)

  if (type === 'response') {
    options.removeWriteOnly = true
    options.removeReadOnly = false
  } else if (type === 'request') {
    options.removeWriteOnly = false
    options.removeReadOnly = true
  }

  schema = toJsonSchema(schema, options)
  schema = transformDynamicRefExtension(schema) ?? {}

  return schema
}

/**
 * Append parameters not in requestBody to the resulting schema
 */
function appendParameters(resultSchema: JSONSchema7, spec: any, schemaOptions: SchemaOptions): JSONSchema7 {
  const options: ToJsonSchemaOptions = {
    ...schemaOptions,
    removeWriteOnly: true,
    removeReadOnly: false,
  }

  // Detect circular dependencies and replace them with a special key
  let schema = spec
  try {
    schema = JSON.parse(JSON.stringify(spec))
  } catch (e) {
    schema = decycle(spec)
  }

  schema = mergeAllOf(schema, mergeAllOfOptions)

  const parameters = schema.parameters.filter((param) => !param['x-ignore'])
  const propertiesFromParams = {}
  for (const param of parameters) {
    if (param.required) {
      resultSchema.required = resultSchema.required ?? []
      resultSchema.required.push(param.name)
    }
    const property: JSONSchema7 = fromParameter(param, options)
    if (property.$schema) {
      delete property.$schema
    }

    // Where the parameter should be sent
    property['x-in'] = param.in ?? 'query'

    propertiesFromParams[param.name] = property
  }

  // add param properties before requestBody properties
  resultSchema.properties = {
    ...propertiesFromParams,
    ...(resultSchema.properties ?? {}),
  }

  return resultSchema
}
