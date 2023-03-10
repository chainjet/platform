import { removeScientificNotation } from '@app/common/utils/number.utils'

describe('NumberUtils', () => {
  describe('removeScientificNotation', () => {
    it('should remove the scientific notation of a large number', () => {
      expect(removeScientificNotation(1e21)).toEqual('1000000000000000000000')
      expect(removeScientificNotation(1e40)).toEqual('10000000000000000000000000000000000000000')
    })

    it('should remove the scientific notation of a small number', () => {
      expect(removeScientificNotation(1e-21)).toEqual('0.000000000000000000001')
      expect(removeScientificNotation(1e-40)).toEqual('0.0000000000000000000000000000000000000001')
    })

    it('should not change numbers without scientific notation', () => {
      expect(removeScientificNotation(100)).toEqual('100')
      expect(removeScientificNotation(1000000000000000)).toEqual('1000000000000000')
      expect(removeScientificNotation(0.001)).toEqual('0.001')
      expect(removeScientificNotation(0.00000000000001)).toEqual('0.00000000000001')
    })
  })
})
