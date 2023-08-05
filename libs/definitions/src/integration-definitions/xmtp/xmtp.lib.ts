import { Client } from '@xmtp/xmtp-js'

const clientsCache = new Map<string, Client>()

export const XmtpLib = {
  async getClient(key: string, env: 'production' | 'dev' = 'production'): Promise<Client> {
    if (!clientsCache.has(key)) {
      const keys = new Uint8Array(key.split(',').map((key: string) => Number(key)))
      const client = await Client.create(null, {
        privateKeyOverride: keys,
        env,
        appVersion: 'ChainJet/1.0.0',
      })
      clientsCache.set(key, client)
    }
    return clientsCache.get(key)!
  },
}
