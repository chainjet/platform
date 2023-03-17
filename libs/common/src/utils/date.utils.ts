import { BadRequestException } from '@nestjs/common'

export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

export function parseTime(time: string): [number, number] {
  const [hours, minutes] = time.split(':').map((x) => Number(x))
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    throw new BadRequestException('Time is not valid')
  }
  return [hours, minutes]
}

/**
 * Returns the date in exactly one month from now or a given start date
 * If now is March 14th at 13:15, it will return April 14th at 13:15
 */
export function addOneMonth(start: Date = new Date()): Date {
  start.setMonth(start.getMonth() + 1)
  return start
}
