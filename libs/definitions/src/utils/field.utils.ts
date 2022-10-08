import { getAddress, isAddress } from 'ethers/lib/utils'
import { VarEvm } from '../operation-evm'

export function hasInterpolation(str: string) {
  return /{{\s*([^}]+)\s*}}/.test(str)
}

function parseSolidityInterpolation(str: string) {
  const interpolated = getInterpolatedValue(str)
  if (interpolated) {
    const parts = interpolated.split(':')
    if (parts.length === 2 && parts[0] === 'solidity') {
      return parts[1].trim()
    }
  }
  return str
}

export function getInterpolatedValue(str: string) {
  const match = (str ?? '').toString().match(/{{\s*([^}]+)\s*}}/)
  if (!match) {
    return null
  }
  return match[1].trim()
}

export function getVarName(base: string, usedVars: VarEvm[]) {
  if (!usedVars.some((v) => v.name === base)) {
    return base
  }
  let i = 2
  while (usedVars.some((v) => v.name === `${base}${i}`)) {
    i++
  }
  return `${base}${i}`
}

export function parseAddressType(input: string, name: string, usedVars: VarEvm[]) {
  const args: VarEvm[] = []
  let value: string
  input = parseSolidityInterpolation(input)
  if (hasInterpolation(input)) {
    value = getVarName(`_${name}`, usedVars)
    args.push({ type: 'address', name: value })
  } else if (isAddress(input)) {
    value = getAddress(input)
  } else {
    value = input
  }
  return { value, args }
}

export function parseUint256Type(input: string, name: string, usedVars: VarEvm[]) {
  const args: VarEvm[] = []
  let value: string
  input = parseSolidityInterpolation(input)
  if (hasInterpolation(input)) {
    value = getVarName(`_${name}`, usedVars)
    args.push({ type: 'uint256', name: value })
  } else {
    value = input
  }
  return { value, args }
}
