import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { refreshLensAccessToken } from './lens.common'

export const LensLib = {
  async getRefreshedAccountCredentials(accountCredential: AccountCredential) {
    return await refreshLensAccessToken(accountCredential.credentials.refreshToken)
  },
}
