import * as bcryptjs from 'bcryptjs'
import { randomBytes } from 'crypto'

export const SecurityUtils = {
  hashWithBcrypt: async (str: string, saltRounds: number) => {
    const salt = await bcryptjs.genSalt(saltRounds)
    return await bcryptjs.hash(str, salt)
  },

  bcryptHashIsValid: async (value: string, hash: string) => await bcryptjs.compare(value, hash),

  generateRandomString: (length: number): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''

    const bytes = randomBytes(length)
    for (const byte of bytes) {
      result += charset[byte % charset.length]
    }

    return result
  },
}
