import { VarEvm } from '../operation-evm'

export function hasInterpolation(str: string) {
  return /{{\s*([^}]+)\s*}}/.test(str)
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
