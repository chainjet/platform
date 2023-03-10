/**
 * Remove scientific notation from a number
 * Examples:
 *   * 1e7  => 10000000
 *   * 1e-7 => 0.0000001
 */
export function removeScientificNotation(num: number): string {
  const [sign, number] = Math.sign(num) === -1 ? ['-', `${num}`.slice(1)] : ['', `${num}`]
  const [basePart, exponentPart] = number.split(/[e]/gi)

  if (!exponentPart) {
    return sign + number
  }

  const decimalSeparator = (0.1).toLocaleString().substring(1, 2)
  const base = basePart.replace(/^0+/, '').replace(decimalSeparator, '')
  const exponent = +exponentPart
  const pos = base.split(decimalSeparator)[1] ? base.indexOf(decimalSeparator) + exponent : base.length + exponent
  const wholePart = '' + BigInt(base)

  return (
    sign +
    (exponent >= 0
      ? pos - base.length >= 0
        ? wholePart + '0'.repeat(pos - base.length)
        : base.slice(0, pos) + decimalSeparator + base.slice(pos)
      : pos <= 0
      ? '0' + decimalSeparator + '0'.repeat(Math.abs(pos)) + wholePart
      : base.slice(0, pos) + decimalSeparator + base.slice(pos))
  )
}
