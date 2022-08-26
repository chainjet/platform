export type AsyncSchema = {
  name: string
  dependencies?: string[] // refresh only if one of these dependencies changed
  any?: boolean // refresh on changes to any dependency
}
