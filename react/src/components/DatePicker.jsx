import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

const toKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const DatePicker = ({ value, onChange, min }) => {
  const initialDate = value ? new Date(`${value}T00:00:00`) : new Date()
  const [visibleMonth, setVisibleMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
  const [closedDates, setClosedDates] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    api.get('closed-dates')
      .then((response) => {
        if (!cancelled) setClosedDates(new Set(response.data.map((entry) => toKey(new Date(entry.date)))))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const startOffset = firstDay.getDay()
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
    return Array.from({ length: startOffset + daysInMonth }, (_, index) => {
      if (index < startOffset) return null
      return new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - startOffset + 1)
    })
  }, [visibleMonth])

  const previousMonth = () => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  const nextMonth = () => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  const monthLabel = visibleMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })

  return (
    <div className='date-picker'>
      <div className='date-picker-header'>
        <button type='button' onClick={previousMonth} aria-label='חודש קודם'>‹</button>
        <strong>{monthLabel}</strong>
        <button type='button' onClick={nextMonth} aria-label='חודש הבא'>›</button>
      </div>
      <div className='date-picker-weekdays'>{['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className='date-picker-grid'>
        {days.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />
          const dateKey = toKey(date)
          const isClosed = closedDates.has(dateKey)
          const isBeforeMin = min && dateKey < min
          const isSelected = value === dateKey
          return (
            <button
              key={dateKey}
              type='button'
              className={`${isClosed ? 'closed' : ''} ${isSelected ? 'selected' : ''}`}
              disabled={isClosed || isBeforeMin}
              onClick={() => onChange(dateKey)}
              title={isClosed ? 'היום סגור להזמנות' : undefined}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      {value && <p className='date-picker-value'>נבחר: {new Date(`${value}T00:00:00`).toLocaleDateString('he-IL')}</p>}
    </div>
  )
}

export default DatePicker
