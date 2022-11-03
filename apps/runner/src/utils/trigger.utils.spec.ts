import { JSONSchema7 } from 'json-schema'
import { extractFirstItem, extractTriggerItems, getCreationDate, getItemSchemaFromRes } from './trigger.utils'

describe('Trigger Utils', () => {
  describe('extratTriggerItems', () => {
    it('should extract the items from an array', async () => {
      expect(extractTriggerItems('data[].id', { data: [{ id: 123, foo: 'bar' }, { id: 456 }] })).toEqual([
        { id: 123, item: { id: 123, foo: 'bar' } },
        { id: 456, item: { id: 456 } },
      ])
    })

    it('should extract the id from complex ids', async () => {
      expect(extractTriggerItems('data.items[].id', { data: { items: [{ id: 123 }] } })).toEqual([
        { id: 123, item: { id: 123 } },
      ])
      expect(extractTriggerItems('data.a[].b.c', { data: { a: [{ b: { c: 123 } }] } })).toEqual([
        { id: 123, item: { c: 123 } },
      ])
    })

    it('should return an empty array if the data does not match the key', async () => {
      expect(extractTriggerItems('data.items[].id', { data: { a: [] } })).toEqual([])
      expect(extractTriggerItems('data.a[].b.c', {})).toEqual([])
    })

    it('should return an empty array if id is not a number of string', async () => {
      expect(extractTriggerItems('data[].id', { data: [{ id: { a: 1 } }] })).toEqual([])
      expect(extractTriggerItems('data[].id', { data: [{ id: true }] })).toEqual([])
      expect(extractTriggerItems('data[].id', { data: [{ id: [] }] })).toEqual([])
    })
  })

  describe('extractFirstItem', () => {
    it('should extract the id from a simple object', async () => {
      expect(extractFirstItem('id', { id: 123 })).toEqual({ id: 123, item: { id: 123 } })
    })

    it('should extract the first id from an array', async () => {
      expect(extractFirstItem('data[].id', { data: [{ id: 123, foo: 'bar' }, { id: 456 }] })).toEqual({
        id: 123,
        item: { id: 123, foo: 'bar' },
      })
    })

    it('should extract the id from an object', async () => {
      expect(extractFirstItem('data.id', { data: { id: 123 } })).toEqual({ id: 123, item: { id: 123 } })
    })

    it('should extract the id from complex responses', async () => {
      expect(extractFirstItem('data.items[].id', { data: { items: [{ id: 123 }] } })).toEqual({
        id: 123,
        item: { id: 123 },
      })
      expect(extractFirstItem('data.a[].b.c', { data: { a: [{ b: { c: 123 } }] } })).toEqual({
        id: 123,
        item: { c: 123 },
      })
    })

    it('should return null if the data does not match the key', async () => {
      expect(extractFirstItem('data.id', { data: { a: 123 } })).toEqual(null)
      expect(extractFirstItem('data.items[].id', { data: { a: [] } })).toEqual(null)
      expect(extractFirstItem('data.a[].b.c', {})).toEqual(null)
    })

    it('should return null if id is not a number of string', async () => {
      expect(extractFirstItem('data.id', { data: { id: { a: 1 } } })).toEqual(null)
      expect(extractFirstItem('data.id', { data: { id: true } })).toEqual(null)
      expect(extractFirstItem('data.id', { data: { id: [] } })).toEqual(null)
    })
  })

  describe('getItemSchemaFromRes', () => {
    it('should get the item schema for an array schema', () => {
      const schema: JSONSchema7 = {
        type: 'array',
        items: {
          properties: {
            id: {
              type: 'string',
            },
          },
        },
      }
      expect(getItemSchemaFromRes('[].id', schema)).toEqual({
        properties: {
          id: { type: 'string' },
        },
      })
    })

    it('should get the item schema for an array inside a deep object', () => {
      const schema: JSONSchema7 = {
        properties: {
          res: {
            properties: {
              items: {
                type: 'array',
                items: {
                  properties: {
                    id: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      }
      expect(getItemSchemaFromRes('res.items[].id', schema)).toEqual({
        properties: {
          id: { type: 'string' },
        },
      })
    })

    it('should return null if the idKey is not on the schema', () => {
      const schema: JSONSchema7 = {
        type: 'array',
        items: {
          properties: {},
        },
      }
      expect(getItemSchemaFromRes('[].id', schema)).toBeNull()
    })
  })

  describe('getCreationDate', () => {
    it('should return the creation date of items using ISO dates', () => {
      const item1 = {
        createdAt: '2020-01-01T00:00:00.000Z',
      }
      const item2 = {
        created_at: '2020-01-01T00:00:00.000Z',
      }
      const item3 = {
        creationdate: '2020-01-01T00:00:00.000Z',
      }
      const item4 = {
        creationDate: '2020-01-01T00:00:00.000Z',
      }
      const item5 = {
        timestamp: '2020-01-01T00:00:00.000Z',
      }
      expect(getCreationDate(item1)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
      expect(getCreationDate(item2)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
      expect(getCreationDate(item3)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
      expect(getCreationDate(item4)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
      expect(getCreationDate(item5)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
    })

    it('should return the creation date of items using unix timestamps in milliseconds', () => {
      const item1 = {
        timestamp: 1577836800000,
      }
      const item2 = {
        timestamp: '1577836800000',
      }
      expect(getCreationDate(item1)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
      expect(getCreationDate(item2)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
    })

    it('should return the creation date of items using unix timestamps in seconds', () => {
      const item1 = {
        timestamp: 1577836800,
      }
      const item2 = {
        timestamp: '1577836800',
      }
      expect(getCreationDate(item1)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
      expect(getCreationDate(item2)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
    })
  })
})
