import { getInterpolatedVariables } from './field.utils'

describe('FieldUtils', () => {
  describe('getInterpolatedVariables', () => {
    it('should extract interpolated variables from simple objects', () => {
      expect(getInterpolatedVariables({ a: '{{output.foo}}' })).toEqual(['output.foo'])
      expect(getInterpolatedVariables({ a: '{{output.foo}} {{a.b.c}}' })).toEqual(['output.foo', 'a.b.c'])
      expect(getInterpolatedVariables({ a: '{{output.foo}}', b: '{{a.b.c}}' })).toEqual(['output.foo', 'a.b.c'])
      expect(getInterpolatedVariables({ a: '{{output.foo}}', b: '{{a.b.c}}', c: 'foo' })).toEqual([
        'output.foo',
        'a.b.c',
      ])
      expect(getInterpolatedVariables({ a: 'pre {{ output.foo }} post' })).toEqual(['output.foo'])
    })

    it('should extract interpolated variables from nested objects', () => {
      expect(getInterpolatedVariables({ a: { b: '{{output.foo}}' } })).toEqual(['output.foo'])
      expect(getInterpolatedVariables({ a: { b: '{{output.foo}}' }, c: '{{a.b.c}}' })).toEqual(['output.foo', 'a.b.c'])
      expect(getInterpolatedVariables({ a: { blur: '{{output.foo}}' }, c: '{{a.b.c}}', d: 'foo' })).toEqual([
        'output.foo',
        'a.b.c',
      ])
      expect(getInterpolatedVariables({ a: { b: 'pre {{ output.baz }} post' } })).toEqual(['output.baz'])
    })

    it('should extract interpolated variables from arrays', () => {
      expect(getInterpolatedVariables({ a: ['{{output.foo}}'] })).toEqual(['output.foo'])
      expect(getInterpolatedVariables({ a: ['{{output.foo}}'], b: ['{{a.b.c}}'] })).toEqual(['output.foo', 'a.b.c'])
      expect(getInterpolatedVariables({ a: ['{{output.foo}}'], b: ['{{a.b.c}}'], c: ['foo'] })).toEqual([
        'output.foo',
        'a.b.c',
      ])
      expect(
        getInterpolatedVariables({ a: [{ b: '{{ output.foo }}', c: '{{output.bar}}' }], d: { e: '{{ output.baz }}' } }),
      ).toEqual(['output.foo', 'output.bar', 'output.baz'])
    })

    it('should not return primitive as variables', () => {
      expect(getInterpolatedVariables({ a: '{{ 3 + 5 }}', b: { c: '{{ "foo" }}' } })).toEqual([])
    })

    it('should support variables with arithmetic operators', () => {
      expect(getInterpolatedVariables({ a: '{{ output.foo / 10 }}' })).toEqual(['output.foo'])
    })

    it('should support interpolated functions', () => {
      expect(getInterpolatedVariables({ a: '{{ round(output.foo, 3) }}' })).toEqual(['output.foo'])
      expect(getInterpolatedVariables({ a: '{{ round(output.foo / 10, 3) }}' })).toEqual(['output.foo'])
    })
  })
})
