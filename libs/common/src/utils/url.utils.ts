export function getQueryParam (url: string, param: string): string | null {
  return new URL(url.replace('/#/', '/')).searchParams.get(param)
}
