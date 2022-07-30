import { isValidDate, parseTime } from './date.utils'

describe('DateUtils', () => {
  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate(new Date('01/01/2020'))).toBe(true)
    })

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false)
      expect(isValidDate(new Date('13/01/2020'))).toBe(false)
    })
  })

  describe('parseTime', () => {
    it('should get the hours and minutes from a given time', () => {
      expect(parseTime('12:23')).toEqual([12, 23])
    })

    it('should throw an error if the time is not valid', () => {
      expect(() => parseTime('invalid:time')).toThrow(/Time is not valid/)
      expect(() => parseTime('invalid time')).toThrow(/Time is not valid/)
      expect(() => parseTime('24:10')).toThrow(/Time is not valid/)
      expect(() => parseTime('10:60')).toThrow(/Time is not valid/)
    })
  })
})
