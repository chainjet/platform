import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'

export function extractTriggerItems(
  idKey: string,
  data: Record<string, unknown>,
): Array<{ id: string | number; item: Record<string, unknown>; createdAt?: Date }> {
  const keyParts = idKey.split('[].')
  if (keyParts.length !== 2) {
    const itemId = extractFirstItem(idKey, data)
    return itemId ? [itemId] : []
  }

  const items = _.get(data, keyParts[0]) as Array<Record<string, unknown>>
  const sortItems = sortByCreationDate(items)
  return (Array.isArray(sortItems) ? sortItems : [])
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
        createdAt: getCreationDate(itemValue),
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
  const firstDate = getCreationDate(items[0])
  if (firstDate) {
    return items.sort((a, b) => {
      const dateA = getCreationDate(a)
      const dateB = getCreationDate(b)
      if (!dateA || !dateB) {
        return 0
      }
      return dateB.getTime() - dateA.getTime()
    })
  }
  return items
}

export function getCreationDate(item: Record<string, any>): Date | undefined {
  const createDateKey = Object.keys(item).find((key) =>
    ['created_at', 'createdat', 'creationdate', 'creation_date', 'timestamp'].includes(key.toLowerCase()),
  )
  if (createDateKey) {
    const dateIsNumber = Number.isFinite(Number(item[createDateKey]))
    const dateInSeconds = dateIsNumber && item[createDateKey].toString().length === 10
    const date = dateInSeconds
      ? new Date(Number(item[createDateKey]) * 1000)
      : dateIsNumber
      ? new Date(Number(item[createDateKey])) // new Date returns invalid date for stringified numbers
      : new Date(item[createDateKey])
    if (!isNaN(date.getTime())) {
      return date
    }
  }
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
