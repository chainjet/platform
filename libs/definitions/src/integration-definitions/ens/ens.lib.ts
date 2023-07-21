import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { getAddress } from 'ethers/lib/utils'

export const EnsLib = {
  async getOwner(ensName: string): Promise<string> {
    const query = `
    {
      domains(where: { name: "${ensName}" }) {
        name
        owner {
          id
        }
      }
    }
    `
    const res = await sendGraphqlQuery('https://api.thegraph.com/subgraphs/name/ensdomains/ens', query)
    if (res.errors) {
      throw new Error(res.errors[0].message)
    }
    return getAddress(res.data.domains[0]?.owner?.id)
  },
}
