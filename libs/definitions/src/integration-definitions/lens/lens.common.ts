import { removeScientificNotation } from '@app/common/utils/number.utils'
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
  const profile = res?.data?.profiles?.items?.[0]
  if (!profile?.id) {
    throw new Error(
      `Could not find Lens handle "${handle}".${handle.endsWith('.lens') ? '' : ' Did you forget the ".lens" suffix?'}`,
    )
  }
  return profile
}

/**
 * given a lens profile id or handle, return the profile id
 */
export async function getLensProfileId(profileIdOrHandle: string): Promise<string> {
  // if the profile id is a lens handle, we need to fetch the profile id
  const isLensHandle = !/^0x[a-fA-F0-9]+$/.test(profileIdOrHandle)
  return isLensHandle ? (await getLensProfile(profileIdOrHandle)).id : profileIdOrHandle
}

export function getLensCollectModule({
  recipientAddress,
  collect,
  paidCollect,
  collectFee,
  collectCurrency,
  mirrorReferral,
  maxCollects,
  collectTimeLimit,
}: {
  recipientAddress: string
  collect: 'anyone' | 'followers' | 'none'
  paidCollect: boolean
  collectFee: number
  collectCurrency: string
  mirrorReferral: number
  maxCollects: number
  collectTimeLimit: boolean
}): string {
  // for backwards compatibility
  if (!collect) {
    collect = 'anyone'
    paidCollect = false
  }

  if (collect === 'none') {
    return 'revertCollectModule: true'
  }
  if (!paidCollect) {
    return `freeCollectModule: { followerOnly: ${collect === 'followers'} }`
  }
  const moduleName = collectTimeLimit
    ? maxCollects
      ? 'limitedTimedFeeCollectModule'
      : 'timedFeeCollectModule'
    : maxCollects
    ? 'limitedFeeCollectModule'
    : 'feeCollectModule'
  return `
  ${moduleName}: {
    amount: {
      currency: "${collectCurrency}"
      value: "${removeScientificNotation(collectFee)}"
    }
    recipient: "${recipientAddress}"
    referralFee: ${Math.round(mirrorReferral * 100) / 100}
    followerOnly: ${collect === 'followers'}
    ${maxCollects ? `collectLimit: "${maxCollects}"` : ''}
  }`
}
