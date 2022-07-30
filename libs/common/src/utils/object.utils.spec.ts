import { convertKeys, deleteObjectKeysDeep, isEmptyObj } from '@app/common/utils/object.utils'

describe('ObjectUtils', () => {
  describe('deleteObjectKeysDeep', () => {
    it('should delete keys matching the pattern', async () => {
      const obj = {
        key1: true,
        _key2: false,
        _key3: 1,
        key4: 2
      }
      expect(deleteObjectKeysDeep(obj, key => key.startsWith('_'))).toEqual({
        key1: true,
        key4: 2
      })
    })

    it('should delete deep keys matching the pattern', async () => {
      const obj = {
        key1: true,
        key2: {
          key1: {
            key1: 'test',
            _key2: 123
          },
          _key2: {}
        }
      }
      expect(deleteObjectKeysDeep(obj, key => key.startsWith('_'))).toEqual({
        key1: true,
        key2: {
          key1: {
            key1: 'test'
          }
        }
      })
    })

    it('should delete keys from arrays', () => {
      const obj = {
        key1: true,
        key2: [
          {
            key1: 1,
            _key2: 2
          },
          {
            _key1: 1,
            key2: 2
          }
        ]
      }
      expect(deleteObjectKeysDeep(obj, key => key.startsWith('_'))).toEqual({
        key1: true,
        key2: [
          {
            key1: 1
          },
          {
            key2: 2
          }
        ]
      })
    })
  })

  describe('isEmptyObj', () => {
    it('should return true given an empty object', () => {
      expect(isEmptyObj({})).toBe(true)
    })

    it('should return false if given a non empty object', () => {
      expect(isEmptyObj({ key: 'test' })).toBe(false)
    })
  })

  describe('convertKeys', () => {
    it('should convert the keys of an object given a function', () => {
      const obj = { FoO: 'BaR', bAr: 'fOo' }
      expect(convertKeys(obj, key => key.toLowerCase())).toEqual({ foo: 'BaR', bar: 'fOo' })
    })
  })
})
