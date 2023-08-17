import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { refreshLensAccessToken } from './lens.common'

export const LensLib = {
  async getRefreshedAccountCredentials(accountCredential: AccountCredential) {
    return await refreshLensAccessToken(accountCredential.credentials.refreshToken)
  },

  async fetchLatestFollowers(profileId: string) {
    const url = `https://api.apireum.com/v1/lens/followers/${profileId}?key=${process.env.APIREUM_API_KEY}&sort=-followedAt`
    const res = await fetch(url)
    const data = await res.json()
    return data.followers
  },

  async fetchAllFollowers(profileId: string, cursor = '') {
    const url = `https://api.apireum.com/v1/lens/followers/${profileId}?key=${process.env.APIREUM_API_KEY}&sort=-followedAt&cursor=${cursor}&limit=1000`
    const res = await fetch(url)
    const data = await res.json()
    if (data.followers && data.followers.length >= 1000) {
      return [...data.followers, ...(await LensLib.fetchAllFollowers(profileId, data.cursor))]
    }
    return data.followers ? data.followers : []
  },

  async fetchLatestCollectors(publicationId: string) {
    const url = `https://api.apireum.com/v1/lens/posts/${publicationId}/collections?key=${process.env.APIREUM_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return data.collections
  },

  async fetchAllCollectors(publicationId: string, cursor = '') {
    const url = `https://api.apireum.com/v1/lens/posts/${publicationId}/collections?key=${process.env.APIREUM_API_KEY}&limit=50&cursor=${cursor}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.collections && data.collections.length >= 50) {
      return [...data.collections, ...(await LensLib.fetchAllCollectors(publicationId, data.cursor))]
    }
    return data.collections ? data.collections : []
  },
}
