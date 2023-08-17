export const PoapLib = {
  async fetchLatestEventTokens(eventId: string) {
    const url = `https://api.apireum.com/v1/poap/event/${eventId}/tokens?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt`
    const res = await fetch(url)
    const data = await res.json()
    return data.tokens
  },

  async fetchAllEventTokens(eventId: string, page = 1) {
    const url = `https://api.apireum.com/v1/poap/event/${eventId}/tokens?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt&page=${page}&limit=300`
    const res = await fetch(url)
    const data = await res.json()
    if (data.tokens && data.tokens.length >= 300) {
      return [...data.tokens, ...(await this.fetchAllEventTokens(eventId, page + 1))]
    }
    return data.tokens ? data.tokens : []
  },

  async fetchLatestPoaps(address: string) {
    const url = `https://api.apireum.com/v1/poap/tokens/${address}?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt`
    const res = await fetch(url)
    const data = await res.json()
    return data.tokens
  },

  async fetchAllPoaps(address: string, page = 1) {
    const url = `https://api.apireum.com/v1/poap/tokens/${address}?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt&page=${page}&limit=100`
    const res = await fetch(url)
    const data = await res.json()
    if (data.tokens && data.tokens.length >= 100) {
      return [...data.tokens, ...(await this.fetchAllPoaps(address, page + 1))]
    }
    return data.tokens ? data.tokens : []
  },
}
