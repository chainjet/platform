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
