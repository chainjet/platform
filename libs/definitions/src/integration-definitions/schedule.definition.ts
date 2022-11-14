import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { RunResponse } from '..'

dayjs.extend(utc)

export class ScheduleDefinition extends SingleIntegrationDefinition {
  integrationKey = 'schedule'
  integrationVersion = '1'
  schemaUrl = null

  async run(): Promise<RunResponse> {
    const date = new Date(Date.now())
    const dateDayJs = dayjs(Date.now()).utc()
    return {
      outputs: {
        date: dateDayJs.format('dddd DD, YYYY'),
        time: dateDayJs.format('HH:mm:ss'),
        unixtime: date.getTime(),
        isoString: date.toISOString(),
        year: date.getUTCFullYear(),
        monthName: dateDayJs.format('MMMM'),
        monthNumber: date.getUTCMonth() + 1,
        dayName: dateDayJs.format('dddd'),
        dayOfMonth: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
        timezoneOffset: date.getTimezoneOffset(),
      },
    }
  }
}
