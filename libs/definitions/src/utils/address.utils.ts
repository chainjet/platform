import { getAddress } from 'ethers/lib/utils'
import { EnsLib } from '../integration-definitions/ens/ens.lib'
import { sendGraphqlQuery } from './subgraph.utils'

export async function resolveAddressName(addressName: string) {
  if (!addressName) {
    throw new Error(`Missing address`)
  }
  if (addressName.includes('.')) {
    const query = `
    query {
      Wallet(input: { identity: "${addressName}", blockchain: ethereum }) {
        addresses
      }
    }`
    const res = await sendGraphqlQuery('https://api.airstack.xyz/gql', query, {
      Authorization: process.env.AIRSTACK_API_KEY,
    })
    if (res?.data?.Wallet?.addresses?.[0]) {
      return getAddress(res.data.Wallet.addresses[0])
    }
  }
  if (addressName.endsWith('.eth')) {
    return await EnsLib.getOwner(addressName)
  }
  return addressName
}

export async function getWalletName(address: string) {
  const query = `
  query {
    Wallet(input: {identity: "${address}", blockchain: ethereum}) {
      primaryDomain {
        name
      }
      socials {
        dappName
        profileName
      }
    }
  }`
  const res = await sendGraphqlQuery('https://api.airstack.xyz/gql', query, {
    Authorization: process.env.AIRSTACK_API_KEY,
  })
  const wallet = res?.data?.Wallet
  if (wallet?.primaryDomain?.name) {
    return wallet.primaryDomain.name
  }
  if (wallet?.socials?.[0]?.profileName) {
    return wallet.socials[0].profileName
  }
  return ''
}

export async function getWalletEns(address: string) {
  const query = `
  query {
    Wallet(input: {identity: "${address}", blockchain: ethereum}) {
      primaryDomain {
        name
      }
    }
  }`
  const res = await sendGraphqlQuery('https://api.airstack.xyz/gql', query, {
    Authorization: process.env.AIRSTACK_API_KEY,
  })
  const wallet = res?.data?.Wallet
  if (wallet?.primaryDomain?.name) {
    return wallet.primaryDomain.name
  }
  return ''
}

export async function getWalletLensProfile(address: string) {
  const query = `
  query {
    Socials(
      input: {
        filter: {
          userAssociatedAddresses: {
            _eq: "${address}"
          },
          dappName: {
            _eq: lens
          }
        },
        blockchain: ethereum
      }
    ) {
      Social {
        profileName
        dappName
      }
    }
  }`
  const res = await sendGraphqlQuery('https://api.airstack.xyz/gql', query, {
    Authorization: process.env.AIRSTACK_API_KEY,
  })
  const profileName = res?.data?.Socials?.Social?.[0]?.profileName
  return profileName ?? ''
}

export async function getWalletFarcasterProfile(address: string) {
  const query = `
  query {
    Socials(
      input: {
        filter: {
          userAssociatedAddresses: {
            _eq: "${address}"
          },
          dappName: {
            _eq: farcaster
          }
        },
        blockchain: ethereum
      }
    ) {
      Social {
        profileName
        dappName
      }
    }
  }`
  const res = await sendGraphqlQuery('https://api.airstack.xyz/gql', query, {
    Authorization: process.env.AIRSTACK_API_KEY,
  })
  const profileName = res?.data?.Socials?.Social?.[0]?.profileName
  return profileName ?? ''
}
