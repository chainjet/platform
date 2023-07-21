import { EnsLib } from '../integration-definitions/ens/ens.lib'

export async function resolveAddressName(addressName: string) {
  if (!addressName) {
    throw new Error(`Missing address`)
  }
  if (addressName.endsWith('.eth')) {
    return await EnsLib.getOwner(addressName)
  }
  return addressName
}
