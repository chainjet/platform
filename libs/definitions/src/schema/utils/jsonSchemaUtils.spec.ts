import { JSONSchema7 } from 'json-schema'
import { deleteSchemaProperties, fixSchemaWithOneOf, hideParamsWithSingleEnum, removeDeprecatedProperties, removeIgnoredProperties, removeSchemaMarkdown, transformConstExtension } from './jsonSchemaUtils'

describe('jsonSchemaUtils', () => {
  describe('fixSchemaWithOneOf', () => {
    it('should not change a schema without oneOf', () => {
      expect(fixSchemaWithOneOf({ title: 'test', type: 'number', default: 0 }))
        .toEqual({ title: 'test', type: 'number', default: 0 })
    })

    it('should remove empty oneOf', () => {
      expect(fixSchemaWithOneOf({ title: 'test', oneOf: [] })).toEqual({ title: 'test' })
    })

    it('should merge a single oneOf with the parent property', () => {
      expect(fixSchemaWithOneOf({ title: 'test', oneOf: [{ type: 'boolean', default: true }] }))
        .toEqual({ title: 'test', type: 'boolean', default: true })
    })

    it('should remove the type from a parent property if there are multiple oneOf with type', () => {
      expect(fixSchemaWithOneOf({
        title: 'test',
        type: 'boolean',
        oneOf: [{ type: 'string', default: 'test' }, { type: 'number' }]
      })).toEqual({
        title: 'test',
        oneOf: [{ type: 'string', default: 'test' }, { type: 'number' }]
      })
    })

    it('should conserve the type of the parent property if oneOf do not have type', () => {
      expect(fixSchemaWithOneOf({
        title: 'test',
        type: 'string',
        oneOf: [{ enum: ['a'] }, { enum: ['b'] }]
      })).toEqual({
        title: 'test',
        type: 'string',
        oneOf: [{ enum: ['a'] }, { enum: ['b'] }]
      })
    })

    it('should format oneOf on items', () => {
      expect(fixSchemaWithOneOf({ title: 'test', items: { oneOf: [{ type: 'boolean', default: true }] } }))
        .toEqual({ title: 'test', items: { type: 'boolean', default: true } })
      expect(fixSchemaWithOneOf({ title: 'test', items: [{ oneOf: [{ type: 'boolean', default: true }] }] }))
        .toEqual({ title: 'test', items: [{ type: 'boolean', default: true }] })
    })

    it('should fix oneOf on sub-properties', () => {
      expect(fixSchemaWithOneOf({
        title: 'test',
        properties: {
          key1: {
            type: 'integer',
            oneOf: [{ minimum: 5, default: 0 }]
          },
          key2: {
            type: 'integer',
            oneOf: [{ minimum: 5 }, { maximum: 10 }]
          }
        }
      })).toEqual({
        title: 'test',
        properties: {
          key1: {
            type: 'integer',
            minimum: 5,
            default: 0
          },
          key2: {
            type: 'integer',
            oneOf: [{ minimum: 5 }, { maximum: 10 }]
          }
        }
      })
    })

    it('should fix oneOf for boolean and boolean enum', () => {
      expect(fixSchemaWithOneOf({
        title: 'test',
        oneOf: [{ type: 'boolean', default: true }, { type: 'string', enum: ['true', 'false'], default: 'true' }]
      })).toEqual({
        title: 'test',
        type: 'boolean',
        default: true
      })
    })
  })

  describe('removeSchemaMarkdown', () => {
    it('should remove markdown from the description', () => {
      expect(removeSchemaMarkdown({ description: '**test**' }))
        .toEqual({ description: 'test' })
      expect(removeSchemaMarkdown({ description: 'URL: [example](https://example.org)' }))
        .toEqual({ description: 'URL: example' })
    })

    it('should remove HTML from the description', () => {
      expect(removeSchemaMarkdown({ description: '<b>test</b>' }))
        .toEqual({ description: 'test' })
      expect(removeSchemaMarkdown({ description: 'URL: <a href="https://example.org">example</a>' }))
        .toEqual({ description: 'URL: example' })
    })

    it('should remove markdown from inner properties', () => {
      expect(removeSchemaMarkdown({ properties: { test: { description: '**test**' } } }))
        .toEqual({ properties: { test: { description: 'test' } } })
    })

    it('should remove markdown from inner items', () => {
      expect(removeSchemaMarkdown({ items: [{ description: '**test**' }] }))
        .toEqual({ items: [{ description: 'test' }] })
    })
  })

  describe('removeDeprecatedProperties', () => {
    it('should remove deprecated properties', () => {
      const schema = {
        required: ['foo', 'bar', 'baz'],
        properties: {
          foo: {
            type: 'string',
            deprecated: true
          },
          bar: {
            type: 'string',
            deprecated: false
          },
          baz: {
            type: 'string'
          }
        }
      } as JSONSchema7
      expect(removeDeprecatedProperties(schema)).toEqual({
        required: ['bar', 'baz'],
        properties: {
          bar: {
            type: 'string',
            deprecated: false
          },
          baz: {
            type: 'string'
          }
        }
      })
    })
  })

  describe('removeIgnoredProperties', () => {
    it('should remove ignored properties', () => {
      const schema = {
        required: ['foo', 'bar', 'baz'],
        properties: {
          foo: {
            type: 'string',
            'x-ignore': true
          },
          bar: {
            type: 'string',
            'x-ignore': false
          },
          baz: {
            type: 'string'
          }
        }
      } as JSONSchema7
      expect(removeIgnoredProperties(schema)).toEqual({
        required: ['bar', 'baz'],
        properties: {
          bar: {
            type: 'string',
            'x-ignore': false
          },
          baz: {
            type: 'string'
          }
        }
      })
    })
  })

  describe('transformConstExtension', () => {
    it('should replace x-const with const', () => {
      expect(transformConstExtension({ 'x-const': 'test' } as JSONSchema7)).toEqual({ const: 'test' })
    })

    it('should replace x-const on deep schemas', () => {
      const schema: JSONSchema7 = {
        properties: {
          test: {
            oneOf: [
              {
                title: 'Test',
                'x-const': 'test'
              } as JSONSchema7
            ]
          }
        }
      }
      expect(transformConstExtension(schema)).toEqual({
        properties: {
          test: {
            oneOf: [
              {
                title: 'Test',
                const: 'test'
              }
            ]
          }
        }
      })
    })
  })

  describe('hideParamsWithSingleEnum', () => {
    it('should add x-hidden property to schemas with a single enum', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        enum: ['foo']
      }
      expect(hideParamsWithSingleEnum(schema)).toEqual({ type: 'string', enum: ['foo'], 'x-hidden': true })
    })

    it('should add x-hidden to deep schemas', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            enum: ['foo']
          },
          bar: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['foo']
            }
          }
        }
      }
      expect(hideParamsWithSingleEnum(schema)).toEqual({
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            enum: ['foo'],
            'x-hidden': true
          },
          bar: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['foo'],
              'x-hidden': true
            }
          }
        }
      })
    })
  })

  describe('deleteSchemaProperties', () => {
    it('should remove an array of properties', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        title: 'test',
        description: 'test',
        properties: {}
      }
      expect(deleteSchemaProperties(schema, ['title', 'description'])).toEqual({
        type: 'object',
        properties: {}
      })
    })

    it('should remove properties from a deep object', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        title: 'test',
        description: 'test',
        properties: {
          foo: {
            type: 'string',
            title: 'test'
          },
          bar: {
            type: 'array',
            items: {
              type: 'string',
              description: 'test'
            }
          }
        }
      }
      expect(deleteSchemaProperties(schema, ['title', 'description'])).toEqual({
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      })
    })
  })
})
