const useHebrewWeekendLabel = (formattedDate) =>
  formattedDate.replace(/יום שבת/g, 'מוצאי שבת')

const formatHebrewDate = (value, options) => {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return useHebrewWeekendLabel(
    date.toLocaleDateString('he-IL', options)
  )
}

const formatHebrewCalendarDate = (value, { includeWeekday = false } = {}) => {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const weekday = includeWeekday
    ? date.toLocaleDateString('he-IL', { weekday: 'long' })
    : ''
  const hdate = new HDate(date)
  const gematria = hdate.renderGematriya()
    .trim()
    .replace(/[\u0591-\u05c7]/g, '')
    .replace(/["״׳]/g, '')

  return [weekday, gematria].filter(Boolean).join(' ')
}

export { formatHebrewDate, formatHebrewCalendarDate }
import { HDate } from '@hebcal/core'
