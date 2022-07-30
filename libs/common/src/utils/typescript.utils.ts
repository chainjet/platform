export const assertNever = (x: never): never => {
  throw new Error(`[assertNever] Unexpected object: ${x}`)
}
