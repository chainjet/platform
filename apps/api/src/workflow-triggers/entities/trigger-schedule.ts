interface TriggerScheduleOnce {
  frequency: 'once'
  date: Date
}

interface TriggerScheduleInterval {
  frequency: 'interval'
  interval: number
}

interface TriggerScheduleHour {
  frequency: 'hour'
  minute: number
}

interface TriggerScheduleDay {
  frequency: 'day'
  time: string
}

interface TriggerScheduleWeek {
  frequency: 'week'
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  time: string
}

interface TriggerScheduleMonth {
  frequency: 'month'
  dayOfMonth: number
  time: string
}

interface TriggerScheduleCron {
  frequency: 'cron'
  expression: string
}

export type TriggerSchedule =
  | TriggerScheduleOnce
  | TriggerScheduleInterval
  | TriggerScheduleHour
  | TriggerScheduleDay
  | TriggerScheduleWeek
  | TriggerScheduleMonth
  | TriggerScheduleCron
