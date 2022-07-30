import { calculateExpression, parseInput } from './input.utils'

describe('InputUtils', () => {
  describe('parseInputs', () => {
    it('should preserve input type for non-object types', () => {
      expect(parseInput('foo', {})).toBe('foo')
      expect(parseInput(123, {})).toBe(123)
      expect(parseInput(true, {})).toBe(true)
      expect(parseInput(false, {})).toBe(false)
      expect(parseInput([], {})).toEqual([])
      expect(parseInput(null, {})).toBe(null)
      expect(parseInput(undefined, {})).toBe(undefined)
    })

    it('should preserve object value types', () => {
      expect(parseInput({ foo: 'bar' }, {})).toEqual({ foo: 'bar' })
      expect(parseInput({ foo: 123 }, {})).toEqual({ foo: 123 })
      expect(parseInput({ foo: true }, {})).toEqual({ foo: true })
      expect(parseInput({ foo: false }, {})).toEqual({ foo: false })
      expect(parseInput({ foo: [] }, {})).toEqual({ foo: [] })
      expect(parseInput({ foo: [1, true, 'bar', null] }, {})).toEqual({ foo: [1, true, 'bar', null] })
      expect(parseInput({ foo: null }, {})).toEqual({ foo: null })
      expect(parseInput({ foo: undefined }, {})).toEqual({ foo: undefined })
    })

    it('should return undefined for empty objects', () => {
      expect(parseInput({}, {})).toBeUndefined()
      expect(parseInput({ foo: {} }, {})).toEqual({ foo: undefined })
    })

    it('should parse string variables', () => {
      expect(parseInput({ foo: '{{output.bar}}' }, { output: { bar: 'TEST' } })).toEqual({ foo: 'TEST' })
      expect(parseInput({ foo: '{{ output.bar }}' }, { output: { bar: 'TEST' } })).toEqual({ foo: 'TEST' })
      expect(parseInput({ foo: '{{   output.bar   }}' }, { output: { bar: 'TEST' } })).toEqual({ foo: 'TEST' })
      expect(parseInput({ foo: 'Value: "{{output.bar}}"' }, { output: { bar: 'TEST' } }))
        .toEqual({ foo: 'Value: "TEST"' })
    })

    it('should parse non-string variables', () => {
      expect(parseInput('{{output.bar}}', { output: { bar: 123 } })).toEqual(123)
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: 123 } })).toEqual({ foo: 'Value: 123' })
      expect(parseInput('{{output.bar}}', { output: { bar: true } })).toEqual(true)
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: true } })).toEqual({ foo: 'Value: true' })
      expect(parseInput('{{output.bar}}', { output: { bar: false } })).toEqual(false)
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: false } })).toEqual({ foo: 'Value: false' })
      expect(parseInput('{{output.bar}}', { output: { bar: null } })).toEqual(null)
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: null } })).toEqual({ foo: 'Value: ' })
      expect(parseInput('{{output.bar}}', { output: { bar: undefined } })).toEqual(undefined)
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: undefined } })).toEqual({ foo: 'Value: ' })
      expect(parseInput('{{output.bar}}', { output: { bar: [1, 2] } })).toEqual([1, 2])
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: [1, 2] } })).toEqual({ foo: 'Value: 1,2' })
      expect(parseInput('{{output.bar}}', { output: { bar: {} } })).toEqual({})
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: {} } })).toEqual({ foo: 'Value: {}' })
      expect(parseInput('{{output.bar}}', { output: { bar: new Date('01/01/2020') } })).toEqual(new Date('01/01/2020'))
      expect(parseInput({ foo: 'Value: {{output.bar}}' }, { output: { bar: new Date('01/01/2020') } }))
        .toEqual({ foo: 'Value: 2020-01-01T03:00:00.000Z' })
    })

    it('should support multiple variables', () => {
      expect(parseInput('"{{ foo.bar }} & {{foo.baz}}"', { foo: { bar: 'BAR', baz: 'BAZ' } })).toEqual('"BAR & BAZ"')
    })

    it('should support deep variables', () => {
      expect(parseInput('{{ a.b.c.d.e }}', { a: { b: { c: { d: { e: 123 } } } } })).toEqual(123)
    })

    it('should support array selectors', () => {
      expect(parseInput('{{ a.b }}', { a: { b: [{ c: 123 }] } })).toEqual([{ c: 123 }])
      expect(parseInput('{{ a.b[0] }}', { a: { b: [{ c: 123 }] } })).toEqual({ c: 123 })
      expect(parseInput('{{ a.b[0].c }}', { a: { b: [{ c: 123 }] } })).toEqual(123)
      expect(parseInput('{{ a.b[1].c }}', { a: { b: [{ c: 1 }, { c: 2 }, { c: 3 }] } })).toEqual(2)
    })

    it('should support expressions', () => {
      expect(parseInput('{{ foo.bar + foo.baz }}', { foo: { bar: 3, baz: 2 } })).toEqual(5)
      expect(parseInput('{{ foo.bar - foo.baz }}', { foo: { bar: 3, baz: 2 } })).toEqual(1)
      expect(parseInput('{{ (foo.bar + foo.baz) * 10 }}', { foo: { bar: 3, baz: 2 } })).toEqual(50)
    })
  })

  describe('calculateExpression', () => {
    it('should calculate simple expressions', () => {
      expect(calculateExpression('5 + 3', {})).toEqual(8)
      expect(calculateExpression('5 - 3', {})).toEqual(2)
      expect(calculateExpression('5 * 3', {})).toEqual(15)
      expect(calculateExpression('50 / 5', {})).toEqual(10)
      expect(calculateExpression('5 ^ 2', {})).toEqual(25)
      expect(calculateExpression('sqrt(25)', {})).toEqual(5)
    })

    it('should replace references with their values', () => {
      expect(calculateExpression('foo.bar + foo.baz', { foo: { bar: 5, baz: 3 } })).toEqual(8)
      expect(calculateExpression('foo.bar - 3', { foo: { bar: 5 } })).toEqual(2)
      expect(calculateExpression('5 * foo.bar', { foo: { bar: 3 } })).toEqual(15)
      expect(calculateExpression('foo.bar / foo.baz', { foo: { bar: 50, baz: 5 } })).toEqual(10)
      expect(calculateExpression('foo.bar ^ foo.baz', { foo: { bar: 5, baz: 2 } })).toEqual(25)
      expect(calculateExpression('sqrt(foo.bar)', { foo: { bar: 25 } })).toEqual(5)
    })

    it('should preserve variable types', () => {
      expect(calculateExpression('foo.bar', { foo: { bar: 'bar' } })).toBe('bar')
      expect(calculateExpression('foo.bar', { foo: { bar: 123 } })).toBe(123)
      expect(calculateExpression('foo.bar', { foo: { bar: true } })).toBe(true)
      expect(calculateExpression('foo.bar', { foo: { bar: false } })).toBe(false)
      expect(calculateExpression('foo.bar', { foo: { bar: [] } })).toEqual([])
      expect(calculateExpression('foo.bar', { foo: { bar: null } })).toBe(null)
      expect(calculateExpression('foo.bar', { foo: { bar: undefined } })).toBe(undefined)
    })

    describe('substring', () => {
      it('should calculate substrings', () => {
        expect(calculateExpression('substring("some string")', {})).toBe('some string')
        expect(calculateExpression('substring("some string", 5)', {})).toBe('string')
        expect(calculateExpression('substring("some string", 5, 8)', {})).toBe('str')
      })

      it('should parse variables inside substring', () => {
        expect(calculateExpression('substring(foo.str, 5)', { foo: { str: 'some string' } })).toBe('string')
        expect(calculateExpression('substring(foo.str, foo.s, foo.e)', { foo: { str: 'some string', s: 5, e: 8 } }))
          .toBe('str')
      })
    })
  })
})
