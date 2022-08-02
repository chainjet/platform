import * as bcryptjs from 'bcryptjs'
import { randomBytes } from 'crypto'

export const SecurityUtils = {
  hashWithBcrypt: async (str: string, saltRounds: number) => {
    const salt = await bcryptjs.genSalt(saltRounds)
    return await bcryptjs.hash(str, salt)
  },

  bcryptHashIsValid: async (value: string, hash: string) => await bcryptjs.compare(value, hash),

  generateRandomString: (chars: number): string => {
    const buffer = randomBytes((chars + 1) / 2)
    return buffer.toString('hex').substr(0, chars)
  },
}
