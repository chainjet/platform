import { getQueryParam } from './url.utils'

describe('URL Utils', () => {
  describe('getQueryParam', () => {
    it('should get query param from an URL', () => {
      expect(getQueryParam('https://example.com?foo=bar', 'foo')).toBe('bar')
      expect(getQueryParam('https://example.com?foo=bar&bar=baz', 'bar')).toBe('baz')
      expect(getQueryParam('https://example.com/#/test?foo=bar', 'foo')).toBe('bar')
    })

    it('should return null if the param does not exist', () => {
      expect(getQueryParam('https://example.com?foo=bar', 'test')).toBeNull()
      expect(getQueryParam('https://example.com', 'test')).toBeNull()
    })
  })
})
