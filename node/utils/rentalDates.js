const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const startOfDay = (date) => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

const getItemDateRange = (eventDate, category) => {
  const event = startOfDay(eventDate)
  const pickupDate = addDays(event, -1)
  const returnDate = category === 'מפות' ? addDays(event, 3) : addDays(event, 1)
  return { pickupDate, returnDate }
}

const dateRangesOverlap = (pickupA, returnA, pickupB, returnB) => {
  return pickupA < returnB && pickupB < returnA
}

module.exports = {
  addDays,
  startOfDay,
  getItemDateRange,
  dateRangesOverlap
}
