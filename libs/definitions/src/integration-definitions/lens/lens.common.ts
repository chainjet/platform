import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'

export async function refreshLensAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const query = `
  mutation Refresh {
    refresh(request: {
      refreshToken: "${refreshToken}"
    }) {
      accessToken
      refreshToken
    }
  }`
  const res = await sendGraphqlQuery('https://api.lens.dev/', query)
  return res?.data?.refresh ?? null
}

export async function getLensDefaultProfile(address: string): Promise<{ id: string; handle: string; ownedBy: string }> {
  const query = `
  query DefaultProfile {
    defaultProfile(request: { ethereumAddress: "${address}"}) {
      id
      handle
      ownedBy
    }
  }`
  const res = await sendGraphqlQuery('https://api.lens.dev/', query)
  return res?.data?.defaultProfile ?? null
}

export async function getLensProfile(handle: string): Promise<{ id: string; ownedBy: string }> {
  if (handle.startsWith('@')) {
    handle = handle.substring(1)
  }
  const query = `
  query Profile {
    profiles(request: { handles: ["${handle}"], limit: 1 }) {
      items {
        id
        ownedBy
      }
    }
  }`
  const res = await sendGraphqlQuery('https://api.lens.dev/', query)
  return res?.data?.profiles?.items?.[0] ?? null
}
