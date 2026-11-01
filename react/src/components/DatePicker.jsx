import { useEffect, useMemo, useState } from 'react'
import { HDate, HebrewCalendar, HebrewDateEvent, ParshaEvent } from '@hebcal/core'
import api from '../api/axios'
import './DatePicker.css'

const toKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromKey = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

const toHDate = (date) =>
  new HDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12))

const hdateToLocalDate = (hdate) => {
  const date = hdate.greg()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
}

const getMonthStart = (date) => {
  const hdate = toHDate(date)
  return hdateToLocalDate(
    new HDate(1, hdate.getMonth(), hdate.getFullYear())
  )
}

const stripNiqqud = (text) => text.replace(/[\u0591-\u05c7]/g, '')

const renderPlainGematria = (hdate) =>
  hdate.renderGematriya().trim().replace(/[\u0591-\u05c7]/g, '').replace(/["״׳]/g, '')

const formatHolidayName = (event) => {
  const name = stripNiqqud(event.render('he'))
  return name.includes('חנוכה') ? 'חנוכה' : name
}

const isExcludedHoliday = (event) => {
  const hebrewName = stripNiqqud(event.render('he'))
  const englishName = event.render('en')

  return (
    hebrewName.includes('חג הבנות') ||
    hebrewName.includes('ראש השנה למעשר בהמה') ||
    englishName === 'Leil Selichot'
  )
}

const eventsByYear = new Map()

const getEventsForYear = (hebrewYear) => {
  if (eventsByYear.has(hebrewYear)) {
    return eventsByYear.get(hebrewYear)
  }

  const events = HebrewCalendar.calendar({
    year: hebrewYear,
    isHebrewYear: true,
    il: true,
    sedrot: true,
    noModern: true,
  })

  const eventsByDate = {}

  for (const event of events) {
    if (event instanceof HebrewDateEvent || isExcludedHoliday(event)) continue

    const key = toKey(hdateToLocalDate(event.getDate()))
    eventsByDate[key] ??= []
    eventsByDate[key].push(event)
  }

  eventsByYear.set(hebrewYear, eventsByDate)
  return eventsByDate
}

const getCalendarDetails = (date) => {
  const hdate = toHDate(date)
  const events = getEventsForYear(hdate.getFullYear())[toKey(date)] || []
  const parshaEvent = events.find((event) => event instanceof ParshaEvent)

  return {
    holidays: events
      .filter((event) => !(event instanceof ParshaEvent))
      .map(formatHolidayName),
    parsha: parshaEvent ? stripNiqqud(parshaEvent.render('he')) : '',
  }
}

const getMonthName = (hdate) => {
  const names = {
    1: 'ניסן',
    2: 'אייר',
    3: 'סיוון',
    4: 'תמוז',
    5: 'אב',
    6: 'אלול',
    7: 'תשרי',
    8: 'חשוון',
    9: 'כסלו',
    10: 'טבת',
    11: 'שבט',
  }

  const month = hdate.getMonth()

  if (month === 12) {
    return hdate.isLeapYear() ? 'אדר א׳' : 'אדר'
  }

  if (month === 13) {
    return 'אדר ב׳'
  }

  return names[month] || hdate.getMonthName()
}

const getGregorianRange = (firstDay, lastDay) => {
  const firstLabel = firstDay.toLocaleDateString('he-IL-u-ca-gregory', {
    month: 'long',
  })

  const lastLabel = lastDay.toLocaleDateString('he-IL-u-ca-gregory', {
    month: 'long',
  })

  if (firstLabel === lastLabel) return firstLabel
  return `${firstLabel} – ${lastLabel}`
}

const getMonthData = (monthDate) => {
  const currentHDate = toHDate(monthDate)
  const month = currentHDate.getMonth()
  const year = currentHDate.getFullYear()
  const firstHDate = new HDate(1, month, year)
  const daysInMonth = firstHDate.daysInMonth()
  const firstGregorianDate = hdateToLocalDate(firstHDate)
  const lastGregorianDate = hdateToLocalDate(
    new HDate(daysInMonth, month, year)
  )

  const days = Array(firstGregorianDate.getDay()).fill(null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(hdateToLocalDate(new HDate(day, month, year)))
  }

  while (days.length % 7 !== 0) {
    days.push(null)
  }

  const yearLabel = renderPlainGematria(firstHDate)
    .split(/\s+/)
    .at(-1)

  return {
    days,
    monthLabel: `${getMonthName(firstHDate)} ${yearLabel}`,
    gregorianRange: getGregorianRange(firstGregorianDate, lastGregorianDate),
  }
}

const DatePicker = ({ value, onChange, min }) => {
  const initialDate = value ? fromKey(value) : new Date()
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthStart(initialDate)
  )
  const [closedDates, setClosedDates] = useState(new Set())

  useEffect(() => {
    let cancelled = false

    api
      .get('closed-dates')
      .then((response) => {
        if (cancelled) return

        const dates = response.data.map((entry) =>
          String(entry.date).slice(0, 10)
        )
        setClosedDates(new Set(dates))
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (value) {
      setVisibleMonth(getMonthStart(fromKey(value)))
    }
  }, [value])

  const monthData = useMemo(
    () => getMonthData(visibleMonth),
    [visibleMonth]
  )

  const selectedDate = value ? fromKey(value) : undefined
  const selectedDetails = selectedDate
    ? getCalendarDetails(selectedDate)
    : null

  const disabledBefore = min ? fromKey(min) : null

  const footerText = selectedDate && selectedDetails
    ? [
        renderPlainGematria(toHDate(selectedDate)),
        ...selectedDetails.holidays,
        selectedDetails.parsha,
      ]
        .filter(Boolean)
        .join(' | ')
    : ''

  const changeMonth = (direction) => {
    setVisibleMonth((currentMonth) => {
      const hdate = toHDate(currentMonth)
      const monthStart = hdateToLocalDate(
        new HDate(1, hdate.getMonth(), hdate.getFullYear())
      )
      const offset = direction > 0 ? hdate.daysInMonth() : -1

      const adjacentDate = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        monthStart.getDate() + offset,
        12
      )

      return getMonthStart(adjacentDate)
    })
  }

  return (
    <div className="date-picker" dir="rtl">
      <div className="date-picker-header">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="חודש קודם"
        >
          ‹
        </button>

        <strong>{monthData.monthLabel}</strong>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="חודש הבא"
        >
          ›
        </button>
      </div>

      <div className="gregorian-month-range">
        {monthData.gregorianRange}
      </div>

      <div className="date-picker-weekdays">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="date-picker-grid">
        {monthData.days.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} aria-hidden="true" />
          }

          const dateKey = toKey(date)
          const isClosed = closedDates.has(dateKey)
          const isBeforeMin =
            disabledBefore && dateKey < toKey(disabledBefore)
          const isSelected = value === dateKey
          const hdate = toHDate(date)
          const { holidays, parsha } = getCalendarDetails(date)

          return (
            <button
              key={dateKey}
              type="button"
              className={`calendar-day${isClosed ? ' closed' : ''}${isSelected ? ' selected' : ''}`}
              disabled={isClosed || isBeforeMin}
              onClick={() => onChange(dateKey)}
              title={isClosed ? 'היום סגור להזמנות' : undefined}
            >
              <span className="hebrew-day-number">
                {renderPlainGematria(hdate).split(/\s+/)[0]}
              </span>

              <span className="gregorian-day-number">
                {date.getDate()}
              </span>

              {holidays.map((holiday, holidayIndex) => (
                <span
                  key={`${dateKey}-holiday-${holidayIndex}`}
                  className="calendar-holiday"
                  title={holiday}
                >
                  {holiday}
                </span>
              ))}

              {parsha && (
                <span className="shabbat-parsha">
                  {parsha.replace(/^פרשת\s*/, '')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {footerText && (
        <p className="date-picker-value">נבחר: {footerText}</p>
      )}
    </div>
  )
}

export default DatePicker