const Rental = require('../models/Rental')
const ClosedDate = require('../models/ClosedDate')
const { startOfDay, getItemDateRange, dateRangesOverlap } = require('./rentalDates')

const ACTIVE_STATUSES = ['pending', 'approved', 'picked_up']

const getReservedQuantityForItem = (rentals, itemId, pickupDate, returnDate) => {
  let reserved = 0
  const itemIdStr = itemId.toString()

  for (const rental of rentals) {
    for (const group of rental.groups || []) {
      const groupPickup = startOfDay(group.pickupDate)
      const groupReturn = startOfDay(group.returnDate)

      if (!dateRangesOverlap(pickupDate, returnDate, groupPickup, groupReturn)) {
        continue
      }

      for (const entry of group.items || []) {
        const entryItemId = entry.item._id
          ? entry.item._id.toString()
          : entry.item.toString()

        if (entryItemId === itemIdStr) {
          reserved += entry.quantity
        }
      }
    }
  }

  return reserved
}

const attachAvailabilityForDate = async (items, eventDate, excludeRentalId = null) => {
  const closedDate = await ClosedDate.findOne({ date: startOfDay(eventDate) }).select('_id')
  const rentals = await Rental.find({
    status: { $in: ACTIVE_STATUSES },
    ...(excludeRentalId ? { _id: { $ne: excludeRentalId } } : {})
  }).select('groups')

  return items.map((item) => {
    const itemObj = item.toObject ? item.toObject() : { ...item }
    const { pickupDate, returnDate } = getItemDateRange(eventDate, itemObj.category)
    const reserved = getReservedQuantityForItem(
      rentals,
      itemObj._id,
      pickupDate,
      returnDate
    )
    const availableQuantity = Math.max(0, (itemObj.quantity ?? 0) - reserved)
    const availableOnDate = !closedDate && itemObj.isAvailable !== false && availableQuantity > 0

    return {
      ...itemObj,
      availableQuantity,
      availableOnDate
    }
  })
}

module.exports = {
  ACTIVE_STATUSES,
  attachAvailabilityForDate
}
