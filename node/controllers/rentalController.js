const Rental = require('../models/Rental')
const Item = require('../models/Item')
const ClosedDate = require('../models/ClosedDate')
const { Resend } = require('resend')
const { attachAvailabilityForDate } = require('../utils/availability')

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character])

const sendNewRentalNotification = async (rental) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('New rental notification skipped: RESEND_API_KEY is missing')
    return
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const itemRows = rental.groups.flatMap((group) => group.items).map(({ item, quantity }) =>
      `<li>${escapeHtml(item.title)}: ${quantity}</li>`
    ).join('')
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'האתר שלי <onboarding@resend.dev>',
      to: process.env.ADMIN_NOTIFICATION_EMAIL || 'chayamb0236@gmail.com',
      subject: 'הזמנה חדשה ממתינה לאישור',
      html: `
        <h2>התקבלה הזמנה חדשה</h2>
        <p><strong>לקוח:</strong> ${escapeHtml(rental.user.name)}</p>
        <p><strong>אימייל:</strong> ${escapeHtml(rental.user.email)}</p>
        <p><strong>טלפון:</strong> ${escapeHtml(rental.user.phone || 'לא צוין')}</p>
        <p><strong>תאריך האירוע:</strong> ${new Date(rental.eventDate).toLocaleDateString('he-IL')}</p>
        <p><strong>פריטים:</strong></p>
        <ul>${itemRows}</ul>
        <p><strong>הערות:</strong> ${escapeHtml(rental.notes || 'אין')}</p>
        <p>מספר הזמנה: ${escapeHtml(rental._id)}</p>
      `
    })

    if (error) {
      console.error('New rental notification failed:', error)
    }
  } catch (error) {
    console.error('New rental notification failed:', error)
  }
}

// Return a date without modifying the original Date object
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

// Build the rental groups according to the business rules.
// pickup: one day before the event
// regular items: return one day after the event
// tablecloths (מפות): return three days after the event
const buildGroupsWithDates = async (eventDate, groups) => {
  const event = startOfDay(eventDate)
  const pickupDate = addDays(event, -1)
  const regularReturnDate = addDays(event, 1)
  const tableclothReturnDate = addDays(event, 3)

  const processedGroups = []

  for (const group of groups) {
    if (!group.items || group.items.length === 0) {
      throw new Error('Each rental group must contain at least one item')
    }

    const itemIds = group.items.map((entry) => entry.item)

    const dbItems = await Item.find({
      _id: { $in: itemIds }
    }).select('_id category')

    if (dbItems.length !== itemIds.length) {
      throw new Error('One or more items were not found')
    }

    const containsTablecloth = dbItems.some(
      (item) => item.category === 'מפות'
    )

    processedGroups.push({
      items: group.items.map((entry) => ({
        item: entry.item,
        quantity: entry.quantity
      })),
      pickupDate,
      returnDate: containsTablecloth
        ? tableclothReturnDate
        : regularReturnDate
    })
  }

  return processedGroups
}

const getAllRentals = async (req, res) => {
  const query = req.user.role === 'admin'
    ? {}
    : { user: req.user._id }

  const rentals = await Rental.find(query)
    .populate('user', 'name email phone')
    .populate('groups.items.item')

  res.json(rentals)
}

const getRentalById = async (req, res) => {
  const rental = await Rental.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('groups.items.item')

  if (!rental) {
    return res.status(404).json({
      message: 'Rental not found'
    })
  }

  if (
    req.user.role !== 'admin' &&
    rental.user._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      message: 'Forbidden'
    })
  }

  res.json(rental)
}

const createRental = async (req, res) => {
  try {
    const {
      eventDate,
      groups,
      notes
    } = req.body

    if (!eventDate) {
      return res.status(400).json({
        message: 'eventDate is required'
      })
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({
        message: 'At least one rental group is required'
      })
    }

    const event = new Date(eventDate)

    if (Number.isNaN(event.getTime())) {
      return res.status(400).json({
        message: 'Invalid eventDate'
      })
    }

    // Validate that eventDate is today or in the future
    const today = startOfDay(new Date())
    if (startOfDay(event) < today) {
      return res.status(400).json({
        message: 'Event date must be today or in the future'
      })
    }

    if (await ClosedDate.exists({ date: startOfDay(event) })) {
      return res.status(400).json({ message: 'ההזמנות סגורות בתאריך שנבחר' })
    }

    const processedGroups = await buildGroupsWithDates(
      event,
      groups
    )

    const requestedItems = groups.flatMap((group) => group.items || [])
    const dbItems = await Item.find({
      _id: { $in: requestedItems.map((entry) => entry.item) }
    })
    const itemsWithAvailability = await attachAvailabilityForDate(
      dbItems,
      startOfDay(event)
    )

    // Aggregate quantities by item ID to prevent overselling with duplicate items
    const aggregatedQuantities = {}
    for (const entry of requestedItems) {
      const itemId = entry.item.toString()
      aggregatedQuantities[itemId] = (aggregatedQuantities[itemId] || 0) + entry.quantity
    }

    for (const [itemId, totalQuantity] of Object.entries(aggregatedQuantities)) {
      const found = itemsWithAvailability.find(
        (item) => item._id.toString() === itemId
      )
      if (!found || !found.availableOnDate || totalQuantity > found.availableQuantity) {
        return res.status(400).json({
          message: `Item is not available in the requested quantity for this date: ${found?.title || itemId}`
        })
      }
    }

    const newRental = new Rental({
      user: req.user._id,
      eventDate: startOfDay(event),
      groups: processedGroups,
      notes
    })

    const saved = await newRental.save()

    const populatedRental = await saved.populate([
      {
        path: 'user',
        select: 'name email phone'
      },
      {
        path: 'groups.items.item'
      }
    ])

    await sendNewRentalNotification(populatedRental)

    res.status(201).json(populatedRental)
  } catch (error) {
    console.error('createRental error:', error)

    res.status(400).json({
      message: error.message || 'Failed to create rental'
    })
  }
}

const updateRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)

    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found'
      })
    }

    if (
      req.user.role !== 'admin' &&
      rental.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'Forbidden'
      })
    }

    // For now, do not allow changing the user through this endpoint.
    // The user remains the owner of the rental.
    if (req.body.user) {
      delete req.body.user
    }

    if (
      req.user.role === 'admin' &&
      req.body.eventDate &&
      startOfDay(new Date(req.body.eventDate)).getTime() !== startOfDay(rental.eventDate).getTime()
    ) {
      return res.status(400).json({
        message: 'Admins cannot change the event date'
      })
    }

    // If eventDate or groups are changed, rebuild the groups
    // so their dates remain consistent with the business rules.
    if (req.body.eventDate || req.body.groups) {
      const isAdmin = req.user.role === 'admin'

      // Only allow non-admin users to modify eventDate/groups if rental is pending
      if (!isAdmin && rental.status !== 'pending') {
        return res.status(403).json({
          message: 'Only pending rentals can be modified by the customer'
        })
      }

      const eventDate = req.user.role === 'admin'
        ? rental.eventDate
        : req.body.eventDate
          ? new Date(req.body.eventDate)
          : rental.eventDate

      if (Number.isNaN(eventDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid eventDate'
        })
      }

      // Validate that eventDate is today or in the future
      const today = startOfDay(new Date())
      if (startOfDay(eventDate) < today) {
        return res.status(400).json({
          message: 'Event date must be today or in the future'
        })
      }

      const groups = req.body.groups || rental.groups

      if (await ClosedDate.exists({ date: startOfDay(eventDate) })) {
        return res.status(400).json({ message: 'ההזמנות סגורות בתאריך שנבחר' })
      }

      const processedGroups = await buildGroupsWithDates(
        eventDate,
        groups
      )

      const normalizedEventDate = startOfDay(eventDate)

      // Check availability for the new eventDate and groups
      const requestedItems = groups.flatMap((group) => group.items || [])
      const dbItems = await Item.find({
        _id: { $in: requestedItems.map((entry) => entry.item) }
      })
      const itemsWithAvailability = await attachAvailabilityForDate(
        dbItems,
        normalizedEventDate,
        rental._id
      )

      // Aggregate quantities by item ID to prevent overselling with duplicate items
      const aggregatedQuantities = {}
      for (const entry of requestedItems) {
        const itemId = entry.item.toString()
        aggregatedQuantities[itemId] = (aggregatedQuantities[itemId] || 0) + entry.quantity
      }

      for (const [itemId, totalQuantity] of Object.entries(aggregatedQuantities)) {
        const found = itemsWithAvailability.find(
          (item) => item._id.toString() === itemId
        )
        if (!found || !found.availableOnDate || totalQuantity > found.availableQuantity) {
          return res.status(400).json({
            message: `Item is not available in the requested quantity for this date: ${found?.title || itemId}`
          })
        }
      }

      rental.eventDate = startOfDay(eventDate)
      rental.groups = processedGroups
    }

    if (req.body.status !== undefined) {
      const nextStatus = req.body.status
      const isAdmin = req.user.role === 'admin'

      if (!isAdmin) {
        const canCancel = rental.status === 'pending' && nextStatus === 'cancelled'
        if (!canCancel) {
          return res.status(403).json({
            message: 'Only pending rentals can be cancelled by the customer'
          })
        }
      }

      rental.status = nextStatus
    }

    if (req.body.notes !== undefined) {
      rental.notes = req.body.notes
    }

    await rental.save()

    const populatedRental = await rental.populate([
      {
        path: 'user',
        select: 'name email phone'
      },
      {
        path: 'groups.items.item'
      }
    ])

    res.json(populatedRental)
  } catch (error) {
    console.error('updateRental error:', error)

    res.status(400).json({
      message: error.message || 'Failed to update rental'
    })
  }
}

const deleteRental = async (req, res) => {
  const rental = await Rental.findById(req.params.id)

  if (!rental) {
    return res.status(404).json({
      message: 'Rental not found'
    })
  }

  if (
    req.user.role !== 'admin' &&
    rental.user.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      message: 'Forbidden'
    })
  }

  await rental.deleteOne()

  res.json({
    message: 'Rental deleted'
  })
}

module.exports = {
  getAllRentals,
  getRentalById,
  createRental,
  updateRental,
  deleteRental
}