export interface GqlUserContext {
  id: string
  username: string
}

export interface GqlContext {
  req: {
    user: GqlUserContext
    headers: Record<string, string>
  }
}
