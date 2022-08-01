import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'

export function extractTriggerItems(
  idKey: string,
  data: Record<string, unknown>,
): Array<{ id: string | number; item: Record<string, unknown> }> {
  const keyParts = idKey.split('[].')
  if (keyParts.length !== 2) {
    const itemId = extractFirstItem(idKey, data)
    return itemId ? [itemId] : []
  }

  const items = _.get(data, keyParts[0]) as Array<Record<string, unknown>>
  return (sortByCreationDate(items) ?? [])
    .map((item) => {
      let itemValue

      // the item is only the object containing the id
      if (keyParts[1].includes('.')) {
        itemValue = _.get(item, keyParts[1].split('.').slice(0, -1).join('.')) as Record<string, unknown>
      } else {
        itemValue = item
      }

      return {
        id: _.get(item, keyParts[1]) as string | number,
        item: itemValue,
      }
    })
    .filter((item) => !!item.id && (typeof item.id === 'string' || typeof item.id === 'number'))
}

export function extractFirstItem(
  idKey: string,
  data: Record<string, unknown>,
): { id: string | number; item: Record<string, unknown> } | null {
  const objectKeys = idKey.replace(/\[]\./g, '.0.').split('.')

  let iterationData: any = data
  let item: Record<string, any> = {}
  for (const key of objectKeys) {
    if (!iterationData[key]) {
      return null
    }
    if (key.toString() === '0') {
      iterationData = sortByCreationDate(iterationData)
    }
    item = iterationData
    iterationData = iterationData[key]
  }

  if (typeof iterationData === 'string' || typeof iterationData === 'number') {
    return { id: iterationData, item }
  }
  return null
}

/**
 * Tries to sort a generic array of items by creation time
 * Ideally requests should return items sorted, but some integrations don't support sorting or pagination
 */
export function sortByCreationDate<T extends Record<string, any>>(items: T[]): T[] {
  if (!Array.isArray(items) || !items.length) {
    return items
  }
  const createDateKey = Object.keys(items[0]).find((key) => ['createdat', 'creationdate'].includes(key.toLowerCase()))
  if (createDateKey) {
    const firstDate = new Date(items[0][createDateKey])
    if (!isNaN(firstDate.getTime())) {
      // Check if it's a valid date
      return items.sort((a, b) => new Date(b[createDateKey]).getTime() - new Date(a[createDateKey]).getTime())
    }
  }
  return items
}

export function getItemSchemaFromRes(idKey: string, schema: JSONSchema7): JSONSchema7 | null {
  const objectKeys = idKey
    .replace(/\[]\./g, '.0.')
    .split('.')
    .filter((key) => key)

  let iterationSchema: JSONSchema7 = schema
  let resultSchema: JSONSchema7 = schema
  for (const key of objectKeys) {
    if (key.toString() === '0' && iterationSchema.items) {
      iterationSchema = iterationSchema.items as JSONSchema7
    } else if (iterationSchema.properties?.[key]) {
      resultSchema = iterationSchema
      iterationSchema = iterationSchema.properties[key] as JSONSchema7
    } else {
      return null
    }
  }

  return resultSchema
}
