export class OperationDailyLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OperationDailyLimitError'
  }
}
