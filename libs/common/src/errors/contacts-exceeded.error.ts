import { TooManyRequestsException } from './too-many-requests-exception.error'

export class ContactsExceededError extends TooManyRequestsException {
  constructor(message: string) {
    super(message)
    this.name = 'ContactsExceededError'
  }
}
