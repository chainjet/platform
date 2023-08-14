import { Job } from 'bull'

export class JobNonRetriableError extends Error {
  constructor(job: Job, message: string) {
    job.attemptsMade = (job.opts.attempts ?? 0) + 1
    super(message)
    this.name = 'JobNonRetriableError'
  }
}
