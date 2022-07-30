import { JSONSchema7 } from 'json-schema'
import JsonSchemaGenerator from 'json-schema-generator'
import defaultsDeep from 'lodash.defaultsdeep'
import { stripMarkdownSync } from '../../../../common/src/utils/string.utils'

export function fixSchemaWithOneOf(schema: JSONSchema7): JSONSchema7 {
  if (schema.oneOf) {
    if (!schema.oneOf.length) {
      delete schema.oneOf
    } else if (schema.oneOf.length === 1) {
      schema = defaultsDeep(schema, schema.oneOf[0])
      delete schema.oneOf
    } else {
      // make sure type is not declared in both the parent property and the oneOf
      if (schema.oneOf.some(oneOf => typeof oneOf === 'object' && oneOf.type)) {
        delete schema.type
      }

      // fix oneOf for boolean and boolean enum
      if (schema.oneOf.length === 2) {
        const booleanTypeIndex = schema.oneOf.findIndex(x => typeof x !== 'boolean' && x.type === 'boolean')
        const booleanEnumIndex = schema.oneOf.findIndex(
          x =>
            typeof x !== 'boolean' &&
            x.type === 'string' &&
            x.enum?.length === 2 &&
            x.enum.includes('true') &&
            x.enum.includes('false'),
        )
        if (booleanTypeIndex !== -1 && booleanEnumIndex !== -1) {
          schema.oneOf.splice(booleanEnumIndex, 1)
          return fixSchemaWithOneOf(schema)
        }
      }
    }
  }
  return applySchemaChangeRecursively(schema, fixSchemaWithOneOf)
}

export function removeSchemaMarkdown(schema: JSONSchema7): JSONSchema7 {
  if (schema.description) {
    schema.description = stripMarkdownSync(schema.description)
  }
  return applySchemaChangeRecursively(schema, removeSchemaMarkdown)
}

export function removeDeprecatedProperties(schema: JSONSchema7 & { deprecated?: boolean }): JSONSchema7 | undefined {
  if (schema.deprecated) {
    return undefined
  }

  // Remove deprecated properties from required array
  if (schema.required) {
    schema.required = schema.required.filter(item => {
      return !(schema.properties?.[item] as { deprecated?: boolean })?.deprecated
    })
  }

  return applySchemaChangeRecursively(schema, removeDeprecatedProperties)
}

export function removeIgnoredProperties(schema: JSONSchema7 & { ['x-ignore']?: boolean }): JSONSchema7 | undefined {
  if (schema['x-ignore']) {
    return undefined
  }

  // Remove ignored properties from required array
  if (schema.required) {
    schema.required = schema.required.filter(item => {
      return !(schema.properties?.[item] as { ['x-ignore']?: boolean })?.['x-ignore']
    })
  }

  return applySchemaChangeRecursively(schema, removeIgnoredProperties)
}

/**
 * @deprecated not longer needed with openapi 3.1.0
 */
export function transformConstExtension(schema: JSONSchema7): JSONSchema7 {
  if (schema['x-const']) {
    schema.const = schema['x-const']
    delete schema['x-const']
  }
  return applySchemaChangeRecursively(schema, transformConstExtension)
}

export function transformDynamicRefExtension(schema: JSONSchema7): JSONSchema7 {
  if (schema['x-dynamicRef']) {
    schema.$ref = schema['x-dynamicRef']
    delete schema['x-dynamicRef']
  }
  return applySchemaChangeRecursively(schema, transformDynamicRefExtension)
}

/**
 * Hide enum string parameters with only a value
 * The value for these parameters will be set automatically
 */
export function hideParamsWithSingleEnum(schema: JSONSchema7): JSONSchema7 {
  if (schema.type === 'string' && schema.enum?.length === 1) {
    schema['x-hidden'] = true
  }
  return applySchemaChangeRecursively(schema, hideParamsWithSingleEnum)
}

export function deleteSchemaProperties(schema: JSONSchema7, properties: string[]): JSONSchema7 {
  properties.forEach(property => delete schema[property])
  return applySchemaChangeRecursively(schema, deleteSchemaProperties, properties)
}

export function generateSchemaFromObject(obj: Record<string, any>): JSONSchema7 {
  const schema = JsonSchemaGenerator(obj ?? {}) as JSONSchema7
  return deleteSchemaProperties(schema, ['$schema', 'description', 'required'])
}

/**
 * Helper for applying a schema modification recursively to schema properties and items
 * This method also exists on frontend schema.utils
 */
function applySchemaChangeRecursively<T>(
  schema: JSONSchema7,
  fn: (schema: JSONSchema7, ...args: any[]) => T,
  ...callbackArgs: any[]
): JSONSchema7 {
  // Apply to items
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items = schema.items
        .filter(item => typeof item !== 'boolean')
        .map(item => fn(item as JSONSchema7, ...callbackArgs))
        .filter(item => !!item)
    } else if (typeof schema.items !== 'boolean') {
      schema.items = fn(schema.items, ...callbackArgs)
      if (!schema.items) {
        delete schema.items
      }
    }
  }

  // Apply to properties
  for (const [propKey, property] of Object.entries(schema.properties ?? {})) {
    if (typeof property !== 'boolean') {
      schema.properties = schema.properties ?? {}
      schema.properties[propKey] = fn(property, ...callbackArgs)
      if (!schema.properties[propKey]) {
        delete schema.properties[propKey]
      }
    }
  }

  // Apply to oneOf
  if (schema.oneOf) {
    schema.oneOf = schema.oneOf
      ?.filter(oneOf => typeof oneOf !== 'boolean')
      ?.map(oneOf => fn(oneOf as JSONSchema7, ...callbackArgs))
      ?.filter(oneOf => !!oneOf)
  }

  // Apply to anyOf
  if (schema.anyOf) {
    schema.anyOf = schema.anyOf
      ?.filter(anyOf => typeof anyOf !== 'boolean')
      ?.map(anyOf => fn(anyOf as JSONSchema7, ...callbackArgs))
      ?.filter(anyOf => !!anyOf)
  }

  // Apply to allOf
  if (schema.allOf) {
    schema.allOf = schema.allOf
      ?.filter(allOf => typeof allOf !== 'boolean')
      ?.map(allOf => fn(allOf as JSONSchema7, ...callbackArgs))
      ?.filter(allOf => !!allOf)
  }

  return schema
}
