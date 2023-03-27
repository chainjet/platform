import { getInterpolatedVariables, replaceTemplateFields } from './field.utils'

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
      expect(getInterpolatedVariables({ a: '{{640770e9f509e2b6a9a1cb2f.foo}}' })).toEqual([
        '640770e9f509e2b6a9a1cb2f.foo',
      ])
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

  describe('replaceTemplateFields', () => {
    const idsMap = new Map([
      ['63aafe8641e98d31fbd6b6e5', '63ab05766b40e7706cda1802'],
      ['63aafea641e98d31fbd6b7c9', '63ab05766b40e7706cda180f'],
    ])

    it('should replace template variables', () => {
      const res = replaceTemplateFields(
        idsMap,
        {
          foo: 'Test {{ template.foo }}',
          bar: '{{template.bar}}',
        },
        { foo: 'FOO VALUE', bar: 'BAR VALUE' },
      )
      expect(res).toEqual({
        foo: 'Test FOO VALUE',
        bar: 'BAR VALUE',
      })
    })

    it('should replace interpolated ids', () => {
      const res = replaceTemplateFields(
        idsMap,
        {
          foo: 'Test {{ 63aafe8641e98d31fbd6b6e5.foo }} {{63aafea641e98d31fbd6b7c9.bar[0].baz}}',
          bar: '{{template.templateValue}}',
        },
        { templateValue: 'foo' },
      )
      expect(res).toEqual({
        foo: 'Test {{ 63ab05766b40e7706cda1802.foo }} {{63ab05766b40e7706cda180f.bar[0].baz}}',
        bar: 'foo',
      })
    })

    it('should replace template variables inside functions', () => {
      const res = replaceTemplateFields(
        idsMap,
        {
          foo: 'Test {{ round(template.foo, 3) }}',
          bar: '{{template.bar}}',
        },
        { foo: 25.43, bar: 'BAR' },
      )
      expect(res).toEqual({
        foo: 'Test {{ round(25.43, 3) }}',
        bar: 'BAR',
      })
    })

    it('should replace interpolated ids inside functions', () => {
      const res = replaceTemplateFields(
        idsMap,
        {
          foo: 'Test {{ round(63aafe8641e98d31fbd6b6e5.foo, 63aafea641e98d31fbd6b7c9.bar) }}',
          bar: '{{template.bar}}',
        },
        { bar: 'BAR' },
      )
      expect(res).toEqual({
        foo: 'Test {{ round(63ab05766b40e7706cda1802.foo, 63ab05766b40e7706cda180f.bar) }}',
        bar: 'BAR',
      })
    })

    it('should replace undefined template variables with empty string', () => {
      const res = replaceTemplateFields(idsMap, { foo: 'Test {{ template.foo }}' }, {})
      expect(res).toEqual({
        foo: 'Test ',
      })
    })
  })
})
