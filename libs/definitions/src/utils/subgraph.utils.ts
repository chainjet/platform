import { isEmptyObj } from '@app/common/utils/object.utils'
import { capitalize, humanize } from '@app/common/utils/string.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject, OperationObject, ParameterObject, SchemaObject } from 'openapi3-ts'
import pluralize from 'pluralize'
import { Observable } from 'rxjs'
import { RunResponse } from '../definition'

const introspectionQuery = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}`

interface SubgraphType {
  kind: 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT' | 'LIST' | 'NON_NULL'
  name: string
  ofType: SubgraphType | null
  description: string
  fields: any[] | null
  inputFields: SubgraphInput[] | null
  interfaces: any[] | null
  enumValues: any[] | null
  possibleTypes: any[] | null
}

interface SubgraphInput {
  name: string
  description: string
  type: SubgraphType
  defaultValue: string | null
}

type Endpoints = {
  [key: number]: string
  default: number
}

export async function sendGraphqlQuery(
  endpoint: string,
  query: string,
  headers: Record<string, any> = {},
): Promise<any> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query }),
  })
  const resClone = res.clone()
  try {
    return await res.json()
  } catch (e) {
    console.log(
      `Error fetching ${endpoint}. Status: ${res.status} (${res.statusText}). Response: ${(
        await resClone.text()
      ).replace(/\n/g, '')}`,
    )
    throw e
  }
}

export async function runSubgraphOperation(
  endpoints: Endpoints,
  opts: OperationRunOptions,
): Promise<RunResponse | Observable<RunResponse>> {
  const queryKey = opts.operation.schemaPath?.replace('/#list-', '')
  const where = resolveFilters(opts.inputs.filters ?? [])
  const isTrigger = 'integrationTrigger' in (opts.workflowOperation ?? {})

  // triggers are always sorted desc by the key defined in the integration trigger metadata
  const orderBy = isTrigger ? opts.operation.metadata!.orderByKey : opts.inputs.orderBy ?? ''
  const orderDirection = isTrigger ? 'desc' : opts.inputs.orderDirection ?? 'asc'
  const orderByStatement = orderBy ? `orderBy:${orderBy},orderDirection:${orderDirection},` : ''

  // we need to send the required info on the query body
  // triggers have the response schema of the returned item, but lists have an object with a list of items
  const schemaForQueryBody = isTrigger
    ? opts.operation.schemaResponse
    : (opts.operation.schemaResponse?.properties?.[opts.operation.metadata!.listKey] as any)?.items

  const query = `{
      ${queryKey} (${isTrigger ? 'first: 5,' : ''}${orderByStatement} where: ${where})
        ${schemaToQueryBody(schemaForQueryBody ?? {})}
  }`
  const res = await sendGraphqlQuery(endpoints[endpoints.default], query)
  if (res.errors) {
    throw new Error(res.errors[0].message)
  }
  return {
    outputs: res.data,
  }
}

export async function updateSubgraphSchemaBeforeInstall(
  endpoints: Endpoints,
  schema: OpenAPIObject,
): Promise<OpenAPIObject> {
  const graphqlSchema = await sendGraphqlQuery(endpoints[endpoints.default], introspectionQuery)
  const globalTypes: SubgraphType[] = graphqlSchema.data.__schema.types
  const queryType = globalTypes.find((type) => type.name === 'Query') // fields has all queries

  // lists need to have a where argument
  const validLists = queryType?.fields?.filter((field) => field.args.some((arg) => arg.name === 'where')) ?? []

  // add trigger operations
  for (const field of validLists) {
    const res = createOperation(graphqlSchema, field.name)
    if (res) {
      schema.paths[res.pathKey] = {
        post: res.operation,
      }
    }
  }

  return schema
}

function generateOutputSchema(globalTypes: SubgraphType[], type: SubgraphType, level = 0): SchemaObject {
  // graphql can have cyclic references, so we stop after 3 levels of nesting
  if (level > 3) {
    return {}
  }

  switch (type.kind) {
    case 'NON_NULL':
      return type.ofType ? generateOutputSchema(globalTypes, type.ofType, level) : {} // NOT_NULL doesn't increase level
    case 'LIST':
      const schema = type.ofType ? generateOutputSchema(globalTypes, type.ofType, level + 1) : {}
      if (isEmptyObj(schema)) {
        return {}
      }
      return {
        type: 'array',
        items: schema,
      }
    case 'OBJECT':
      const objType = globalTypes.find((field) => field.name === type.name && field.kind === 'OBJECT')
      const properties =
        objType?.fields?.reduce((prev, curr) => {
          const schema = generateOutputSchema(globalTypes, curr.type, level + 1)
          if (isEmptyObj(schema)) {
            return prev
          }
          return {
            ...prev,
            [curr.name]: schema,
          }
        }, {}) ?? {}
      if (isEmptyObj(properties)) {
        return {}
      }
      return {
        type: 'object',
        properties,
      }
  }

  return {
    type: 'string',
  }
}

function schemaToQueryBody(schema: JSONSchema7): string {
  switch (schema.type) {
    case 'object':
    case 'array':
      const body = Object.keys(schema.properties ?? {}).map((key) =>
        schema.properties![key] ? `${key} ${schemaToQueryBody(schema.properties![key] as JSONSchema7)}` : '',
      )
      if (body.length) {
        return `{ ${body} }`
      }
  }
  return ''
}

function filterValidInputs(inputs: SubgraphInput[]): SubgraphInput[] {
  const comparatorKeys = [
    'not',
    'gt',
    'lt',
    'gte',
    'lte',
    'in',
    'contains',
    'contains_nocase',
    'starts_with',
    'starts_with_nocase',
    'ends_with',
    'ends_with_nocase',
  ]

  return inputs.filter(
    (input) =>
      !input.name.startsWith('_') && !comparatorKeys.some((comparatorKey) => input.name.endsWith(comparatorKey)),
  )
}

function resolveFilters(filters: Array<{ key: string; comparator: string; value: string }>): string {
  const whereClause = filters.map((filter) => {
    const filterValue = isAddress(filter.value) ? filter.value.toLowerCase() : filter.value
    if (filter.key.includes('.')) {
      const parts = filter.key.split('.')
      if (parts.length > 2) {
        throw new Error(`Nested subfilters not supported`)
      }
      return `${parts[0]}_: { ${getComparatorKey(parts[1], filter.comparator)}: "${filterValue}" }`
    }
    return `${getComparatorKey(filter.key, filter.comparator)}: "${filterValue}"`
  })
  return `{ ${whereClause} }`
}

function getComparatorKey(key: string, comparator: string) {
  if (comparator === 'eq') {
    return key
  }
  return `${key}_${comparator}`
}

function createOperation(graphqlSchema: any, listKey: string): { pathKey: string; operation: OperationObject } | null {
  const globalTypes: SubgraphType[] = graphqlSchema.data.__schema.types
  const queryType = globalTypes.find((type) => type.name === 'Query') // fields has all queries

  const operationField = queryType!.fields!.find((field) => field.name === listKey)

  const operationFilterName = operationField.args.find((arg) => arg.name === 'where').type.name
  const operationFilter = globalTypes.find(
    (field) => field.name === operationFilterName && field.kind === 'INPUT_OBJECT',
  )
  const filterInputs: SubgraphInput[] = operationFilter?.inputFields ?? []

  // validate if the field has a valid order by for a trigger
  const orderByFieldName = operationField.args.find((arg) => arg.name === 'orderBy')?.type.name
  const orderByField: SubgraphType =
    orderByFieldName &&
    globalTypes.find((inputType) => inputType.name === orderByFieldName && inputType.kind === 'ENUM')
  const orderByKeys: string[] =
    orderByField?.enumValues?.filter((value) => !value.isDeprecated).map((value) => value.name) ?? []
  const triggerOrderByKey = orderByKeys?.find((value) =>
    ['timestamp', 'createdat', 'blocknumber'].includes(value.toLowerCase()),
  )
  const triggerSupported = !!triggerOrderByKey

  // add filter and subfilters
  const validInputFilters = filterValidInputs(filterInputs).reduce((prev: SubgraphInput[], curr) => {
    if (curr.type.kind === 'INPUT_OBJECT') {
      const subfilterType = globalTypes.find((field) => field.name === curr.type.name && field.kind === 'INPUT_OBJECT')
      const subfilterInputs: SubgraphInput[] = subfilterType?.inputFields ?? []
      if (subfilterInputs?.length) {
        const parentName = curr.name.endsWith('_') ? curr.name.slice(0, -1) : curr.name
        const subfilters = filterValidInputs(subfilterInputs)
          .filter((input) => input.type.kind !== 'INPUT_OBJECT') // don't include nested subfilters
          .map((input) => ({
            ...input,
            name: `${parentName}.${input.name}`,
          }))
        return [...prev, ...subfilters]
      }
    } else {
      return [...prev, curr]
    }
    return prev
  }, [])

  const itemName = pluralize.singular(listKey)

  const operation: OperationObject = {
    ...(triggerSupported
      ? {
          'x-triggerIdKey': `${listKey}[].id`,
          'x-triggerName': `New ${humanize(capitalize(itemName))}`,
          'x-triggerDescription': `Triggers when a new ${humanize(itemName).toLowerCase()} is created`,
        }
      : {
          'x-actionOnly': true,
        }),
    summary: `List ${humanize(capitalize(listKey))}`,
    operationId: `list${capitalize(itemName)}`,
    description: `Returns a list of ${humanize(listKey).toLowerCase()}`,
    parameters: [
      {
        name: 'filters',
        in: 'query',
        required: false,
        schema: createFilters(validInputFilters),
      },
      ...(orderByKeys.length
        ? ([
            {
              name: 'orderBy',
              in: 'query',
              required: false,
              schema: {
                'x-actionOnly': true,
                title: 'Order results by',
                type: 'string',
                default: orderByKeys[0],
                enum: orderByKeys,
              },
            },
            {
              name: 'orderDirection',
              in: 'query',
              required: false,
              schema: {
                'x-actionOnly': true,
                title: 'Order direction',
                type: 'string',
                default: 'asc',
                enum: ['asc', 'desc'],
              },
            },
          ] as ParameterObject[])
        : []),
      // {
      //   name: 'limit',
      //   in: 'query',
      //   required: false,
      //   description: '',
      //   schema: {
      //     'x-actionOnly': true,
      //     type: 'integer',
      //     default: 5,
      //   },
      // },
    ],
    responses: {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                [listKey]: generateOutputSchema(globalTypes, operationField.type.ofType),
              },
            },
          },
        },
      },
    },
    'x-operationMetadata': {
      listKey,
      orderByKey: triggerOrderByKey,
    },
  }

  return {
    pathKey: `/#list-${listKey}`,
    operation,
  }
}

function createFilters(inputs: SubgraphInput[]): SchemaObject {
  return {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          enum: inputs.map((input) => input.name),
        },
        comparator: getComparatorSchema(),
        value: {
          type: 'string',
        },
      },
    },
  }
}

function getComparatorSchema(): SchemaObject {
  return {
    type: 'string',
    default: 'eq',
    oneOf: [
      {
        title: 'Equal to',
        const: 'eq',
      },
      {
        title: 'Not equal to',
        const: 'not',
      },
      {
        title: 'Greather than',
        const: 'gt',
      },
      {
        title: 'Less than',
        const: 'lt',
      },
      {
        title: 'Greather or equal than',
        const: 'gte',
      },
      {
        title: 'Less or equal than',
        const: 'lte',
      },
      {
        title: 'Contains',
        const: 'contains',
      },
      {
        title: 'Not contains',
        const: 'not_contains',
      },
      {
        title: 'Contains (case insensitive)',
        const: 'contains_nocase',
      },
      {
        title: 'Not contains (case insensitive)',
        const: 'not_contains_nocase',
      },
      {
        title: 'Starts with',
        const: 'starts_with',
      },
      {
        title: 'Not starts with',
        const: 'not_starts_with',
      },
      {
        title: 'Starts with (case insensitive)',
        const: 'starts_with_nocase',
      },
      {
        title: 'Not starts with (case insensitive)',
        const: 'not_starts_with_nocase',
      },
      {
        title: 'Ends with',
        const: 'ends_with',
      },
      {
        title: 'Not ends with',
        const: 'not_ends_with',
      },
      {
        title: 'Ends with (case insensitive)',
        const: 'ends_with_nocase',
      },
      {
        title: 'Not ends with (case insensitive)',
        const: 'not_ends_with_nocase',
      },
      // {
      //   title: 'In',
      //   const: 'in',
      // },
    ],
  }
}
