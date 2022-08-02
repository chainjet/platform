export const deleteObjectKeysDeep = <T extends Record<string, unknown>>(
  obj: T,
  keyMatcher: (key: string) => boolean,
): T => {
  return Object.entries(obj ?? {}).reduce((prev, [key, value]) => {
    if (keyMatcher(key)) {
      delete prev[key]
    } else if (Array.isArray(value)) {
      return {
        ...prev,
        [key as keyof T]: value.map((item) => deleteObjectKeysDeep(item, keyMatcher)),
      }
    } else if (value && typeof value === 'object') {
      return {
        ...prev,
        [key as keyof T]: deleteObjectKeysDeep(value as Record<string, unknown>, keyMatcher),
      }
    }
    return prev
  }, obj)
}

export const isEmptyObj = (obj: Record<string, any>): boolean => Object.keys(obj).length <= 0

export function convertKeys<T extends Record<string, unknown>>(object: T, fn: (key: string) => string): T {
  return Object.keys(object).reduce((acc, key) => {
    acc[fn(key)] = object[key]
    return acc
  }, {}) as T
}
