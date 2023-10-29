import { sendGraphqlQuery } from './subgraph.utils'

export async function getNFTBalancePolygon(token: string, owner: string) {
  const query = `
    query {
      TokenBalance(
        input: {
          blockchain: polygon,
          tokenAddress: "${token}",
          owner: "${owner}"
        }
      ) {
        amount
      }
    }`
  const res = await sendGraphqlQuery('https://api.airstack.xyz/gql', query, {
    Authorization: process.env.AIRSTACK_API_KEY,
  })
  return res?.data?.TokenBalance?.amount ?? ''
}
