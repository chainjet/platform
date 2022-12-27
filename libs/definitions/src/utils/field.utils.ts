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

/**
 * Returns an array of the interpolated variables on the inputs
 * See field.utils.spec.ts for examples
 */
export function getInterpolatedVariables(inputs: Record<string, any>): string[] {
  const vars: string[] = []
  for (const input of Object.values(inputs)) {
    if (typeof input === 'object') {
      vars.push(...getInterpolatedVariables(input))
    } else if (typeof input === 'string') {
      const matches = (input ?? '').toString().matchAll(/{{\s*([^}]+)\s*}}/g)
      for (const match of matches) {
        const varMatches = match[1].matchAll(/[a-zA-Z_][a-zA-Z0-9_.]*/g)
        for (const varMatch of varMatches) {
          const varName = varMatch ? varMatch[0].trim() : null
          if (varName && varName.includes('.') && !vars.includes(varName)) {
            vars.push(varName)
          }
        }
      }
    }
  }
  return vars
}

/**
 * Replace template fields recursively.
 */
export function replaceTemplateFields(
  idsMap: Map<string, string>,
  inputs: Record<string, any>,
  templateInputs: Record<string, any> = {},
): Record<string, any> {
  const result = {}
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'object') {
      result[key] = replaceTemplateFields(idsMap, value, templateInputs)
    } else if (typeof value === 'string') {
      let newValue = value
      const matches = value.matchAll(/{{\s*([^}]+)\s*}}/g)
      for (const match of matches) {
        // replace fields that only contain a template variable (the interpolation is removed)
        if (match[1].trim().startsWith('template.')) {
          newValue = newValue.replace(match[0], templateInputs[match[1].trim().replace('template.', '')])
        }
        // replace fields that contain template variables inside functions or other variables (the interpolation is kept)
        else {
          // replace "template." variables
          const templateRegex = /template\.([a-zA-Z0-9_\[\]\.]+)/g
          for (const templateMatch of Array.from((match[1].match(templateRegex) as RegExpMatchArray) ?? [])) {
            newValue = newValue.replace(templateMatch, templateInputs[templateMatch.trim().replace('template.', '')])
          }
          // replace old IDs
          const idRegex = /[0-9a-f]{24}/g
          for (const idMatch of Array.from((match[1].match(idRegex) as RegExpMatchArray) ?? [])) {
            const newId = idsMap.get(idMatch)
            if (newId) {
              newValue = newValue.replace(idMatch, newId)
            }
          }
        }
      }
      result[key] = newValue
    } else {
      result[key] = value
    }
  }
  return result
}
