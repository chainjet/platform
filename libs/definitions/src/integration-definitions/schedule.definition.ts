import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import dayjs from 'dayjs'
import { RunResponse } from '..'

export class ScheduleDefinition extends SingleIntegrationDefinition {
  integrationKey = 'schedule'
  integrationVersion = '1'
  schemaUrl = null

  async run(): Promise<RunResponse> {
    const date = new Date(Date.now())
    const dateDayJs = dayjs(Date.now())
    return {
      outputs: {
        date: dateDayJs.format('dddd DD, YYYY'),
        time: dateDayJs.format('HH:mm:ss'),
        unixtime: date.getTime(),
        isoString: date.toISOString(),
        year: date.getFullYear(),
        monthName: dateDayJs.format('MMMM'),
        monthNumber: date.getMonth() + 1,
        dayName: dateDayJs.format('dddd'),
        dayOfMonth: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        timezoneOffset: date.getTimezoneOffset(),
      },
    }
  }
}
