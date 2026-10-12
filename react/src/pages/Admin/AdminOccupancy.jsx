import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../api/axios'
import AdminShell from './AdminShell'

const labels = { pending: 'ממתינה לאישור', approved: 'אושרה', picked_up: 'נאספה' }
const occupyingStatuses = new Set(Object.keys(labels))
const date = (value) => value ? new Date(value).toLocaleDateString('he-IL') : ''
const dateKey = (value) => {
  if (!value) return ''
  const parsedDate = new Date(value)
  return new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const AdminOccupancy = () => {
  const { user } = useContext(AuthContext)
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') return undefined

    let isActive = true
    const loadRentals = async () => {
      try {
        const response = await api.get('rentals')
        if (isActive) setRentals(response.data)
      } catch (err) {
        if (isActive) setError(err.response?.data?.message || err.message || 'לא ניתן לטעון את תפוסת הכלים')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadRentals()
    return () => { isActive = false }
  }, [user])

  if (!user || user.role !== 'admin') {
    return <main className='admin-page'><h1>אין גישה</h1><p>עבור דף זה דרוש משתמש מנהל.</p></main>
  }

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('he-IL')
  const occupancyMap = new Map()

  rentals.filter((rental) => occupyingStatuses.has(rental.status)).forEach((rental) => {
    ;(rental.groups || []).forEach((group, groupIndex) => {
      const pickupDate = dateKey(group.pickupDate)
      const returnDate = dateKey(group.returnDate)
      const matchesDates = (!dateFrom || returnDate >= dateFrom) && (!dateTo || pickupDate <= dateTo)
      if (!matchesDates) return

      ;(group.items || []).forEach((entry, entryIndex) => {
        const item = entry.item && typeof entry.item === 'object' ? entry.item : null
        const name = item?.code || item?.title || 'כלי לא מזוהה'
        const category = item?.category || ''
        const searchableText = [name, category, item?.subcategory, rental.user?.name, rental.user?.email]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('he-IL')
        if (!searchableText.includes(normalizedSearch)) return

        const itemId = String(item?._id || entry.item || `${rental._id}-${groupIndex}-${entryIndex}`)
        const occupancyItem = occupancyMap.get(itemId) || { id: itemId, name, category, bookings: [] }
        occupancyItem.bookings.push({
          id: `${rental._id}-${groupIndex}-${entryIndex}`,
          pickupDate: group.pickupDate,
          returnDate: group.returnDate,
          eventDate: rental.eventDate,
          quantity: entry.quantity,
          customer: rental.user?.name || 'לקוח לא ידוע',
          status: rental.status
        })
        occupancyMap.set(itemId, occupancyItem)
      })
    })
  })

  const occupancyItems = [...occupancyMap.values()]
    .map((item) => ({
      ...item,
      bookings: item.bookings.sort((first, second) => new Date(first.pickupDate) - new Date(second.pickupDate))
    }))
    .sort((first, second) => first.name.localeCompare(second.name, 'he-IL'))
  const bookingCount = occupancyItems.reduce((total, item) => total + item.bookings.length, 0)

  return (
    <AdminShell title='תפוסת כלים' description='מועדי איסוף והחזרה של כלים בהזמנות פעילות.' className='admin-occupancy-page'>
      {loading && <p className='admin-state is-loading' role='status'>טוען תפוסת כלים...</p>}
      {!loading && error && <p className='error-message'>{error}</p>}
      {!loading && !error && (
        <>
          <section className='admin-rentals-toolbar' aria-label='חיפוש וסינון תפוסת כלים'>
            <label className='admin-rentals-search'>
              <span>חיפוש כלי או לקוח</span>
              <input
                type='search'
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='שם כלי, קטגוריה או לקוח'
              />
            </label>
            <label className='admin-rentals-date-filter'>
              <span>תפוס החל מתאריך</span>
              <input type='date' value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label className='admin-rentals-date-filter'>
              <span>תפוס עד תאריך</span>
              <input type='date' value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} />
            </label>
            <button
              type='button'
              className='admin-rentals-reset'
              onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo('') }}
              disabled={!searchTerm && !dateFrom && !dateTo}
            >
              איפוס
            </button>
          </section>

          <p className='admin-rentals-count' aria-live='polite'>
            {occupancyItems.length} כלים תפוסים · {bookingCount} תקופות תפוסה
          </p>

          {occupancyItems.length === 0 ? (
            <p className='admin-state is-empty' role='status'>אין כלים תפוסים בטווח התאריכים שנבחר.</p>
          ) : (
            <div className='admin-occupancy-list'>
              {occupancyItems.map((item) => (
                <article className='admin-occupancy-card' key={item.id}>
                  <header className='admin-occupancy-header'>
                    <div>
                      <h2>{item.name}</h2>
                      {item.category && <p>{item.category}</p>}
                    </div>
                    <span>{item.bookings.length} תקופות תפוסה</span>
                  </header>
                  <ul className='admin-occupancy-bookings'>
                    {item.bookings.map((booking) => (
                      <li key={booking.id}>
                        <div className='admin-occupancy-dates'>
                          <strong>{date(booking.pickupDate)} – {date(booking.returnDate)}</strong>
                          <span>תאריך אירוע: {date(booking.eventDate)}</span>
                        </div>
                        <div className='admin-occupancy-customer'>
                          <strong>{booking.customer}</strong>
                          <span>{booking.quantity} יחידות</span>
                        </div>
                        <span className={`status-badge status-${booking.status}`}>{labels[booking.status]}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}

export default AdminOccupancy