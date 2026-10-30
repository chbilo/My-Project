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

export { formatHebrewDate }
