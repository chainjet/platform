export function hasInterpolation(str: string) {
  return /{{\s*([^}]+)\s*}}/.test(str)
}
