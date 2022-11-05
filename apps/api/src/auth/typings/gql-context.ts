export interface GqlUserContext {
  id: string
  address: string
}

export interface GqlContext {
  req: {
    user?: GqlUserContext
    headers: Record<string, string>
  }
}
