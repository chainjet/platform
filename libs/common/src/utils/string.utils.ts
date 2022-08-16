import remark from 'remark'
import strip from 'strip-markdown'

export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.substr(1)

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * camelCase to kebab-case
 */
export const toKebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

export const humanize = (str: string): string => str.replace(/([a-z])([A-Z])/g, '$1 $2')

/**
 * Removes markdown and html from a string
 */
export function stripMarkdown(str: string): Promise<string> {
  // A @ is added at the beginning and then removed before returning, as a work around for an open issue:
  // https://github.com/remarkjs/strip-markdown/issues/19
  return new Promise((resolve, reject) => {
    remark()
      .use(strip)
      .process('@' + str, (err, file) => {
        if (err) {
          return reject(err)
        }
        resolve(file.toString().trim().substr(1))
      })
  })
}

export function stripMarkdownSync(str: string): string {
  // A @ is added at the beginning and then removed before returning, as a work around for an open issue:
  // https://github.com/remarkjs/strip-markdown/issues/19
  return remark()
    .use(strip)
    .processSync('@' + str)
    .toString()
    .trim()
    .substr(1)
}

export function addEllipsis(str: string, maxLength: number): string {
  if (str.length > maxLength) {
    return str.substr(0, maxLength).trim() + '...'
  }
  return str
}
