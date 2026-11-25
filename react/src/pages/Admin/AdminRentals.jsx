import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api, { getUploadUrl } from '../../api/axios'
import AdminShell from './AdminShell'
import { formatHebrewDate } from '../../utils/dateLabels'

const labels = { pending: 'ממתינה לאישור', approved: 'אושרה', rejected: 'נדחתה', picked_up: 'נאספה', returned: 'הוחזרה', cancelled: 'בוטלה' }
const actions = { pending: [['approved', 'אשר'], ['rejected', 'דחה']], approved: [['picked_up', 'סמן כנאספה']], picked_up: [['returned', 'סמן כהוחזרה']] }
const date = (value) => formatHebrewDate(value)
const dateKey = (value) => {
  if (!value) return ''
  const parsedDate = new Date(value)
  return new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const AdminRentals = () => {
  const { user } = useContext(AuthContext)
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingRentalId, setEditingRentalId] = useState(null)
  const [savingRentalId, setSavingRentalId] = useState(null)
  const [availabilityByItemId, setAvailabilityByItemId] = useState({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [removedEntriesByRental, setRemovedEntriesByRental] = useState({})
  const [addedEntriesByRental, setAddedEntriesByRental] = useState({})
  const [addCodeByRental, setAddCodeByRental] = useState({})
  const [addQuantityByRental, setAddQuantityByRental] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setRentals((await api.get('rentals')).data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'לא ניתן לטעון הזמנות')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (user?.role === 'admin') load() }, [user])

  if (!user || user.role !== 'admin') return <main id='main-content' tabIndex={-1} className='admin-page'><h1>אין גישה</h1></main>

  const update = async (id, status) => {
    try { await api.put(`rentals/${id}`, { status }); await load() } catch (err) { setError(err.response?.data?.message || err.message || 'עדכון הסטטוס נכשל') }
  }

  const loadAvailability = async (eventDate) => {
    if (!eventDate) return

    setAvailabilityLoading(true)
    try {
      const response = await api.get('items', { params: { eventDate } })
      setAvailabilityByItemId(Object.fromEntries(response.data.map((item) => [item._id, item])))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'לא ניתן לטעון את המלאי לתאריך שנבחר')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const startEditing = (rental) => {
    setEditingRentalId(rental._id)
    setError('')
    setRemovedEntriesByRental((prev) => ({ ...prev, [rental._id]: [] }))
    setAddedEntriesByRental((prev) => ({ ...prev, [rental._id]: [] }))
    setAddCodeByRental((prev) => ({ ...prev, [rental._id]: '' }))
    setAddQuantityByRental((prev) => ({ ...prev, [rental._id]: 1 }))
    loadAvailability(rental.eventDate ? new Date(rental.eventDate).toISOString().split('T')[0] : '')
  }

  const removeEntry = (rentalId, groupIndex, itemIndex) => {
    const key = `${groupIndex}-${itemIndex}`
    setRemovedEntriesByRental((prev) => ({
      ...prev,
      [rentalId]: [...(prev[rentalId] || []), key].filter((value, index, array) => array.indexOf(value) === index)
    }))
  }

  const addItemByCode = (rental) => {
    const code = (addCodeByRental[rental._id] || '').trim().toLocaleLowerCase('he-IL')
    const quantity = Number(addQuantityByRental[rental._id] || 1)

    if (!code) {
      setError('יש להזין קוד מוצר')
      return
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError('כמות ההוספה חייבת להיות לפחות 1')
      return
    }

    const item = Object.values(availabilityByItemId).find((candidate) =>
      (candidate.code || candidate.title || '').trim().toLocaleLowerCase('he-IL') === code
    )

    if (!item) {
      setError(`לא נמצא מוצר עם הקוד ${addCodeByRental[rental._id]}`)
      return
    }
    if (!item.availableOnDate || quantity > item.availableQuantity) {
      setError(`המלאי של ${item.code || item.title} אינו מספיק. נותרו ${item.availableQuantity ?? 0} יחידות`)
      return
    }

    setAddedEntriesByRental((prev) => ({
      ...prev,
      [rental._id]: [...(prev[rental._id] || []), { item, quantity }]
        .reduce((entries, entry) => {
          const existing = entries.find((candidate) => (candidate.item._id || candidate.item) === entry.item._id)
          if (existing) existing.quantity += entry.quantity
          else entries.push({ item: entry.item, quantity: entry.quantity })
          return entries
        }, [])
    }))
    setAddCodeByRental((prev) => ({ ...prev, [rental._id]: '' }))
  }

  const saveEdit = async (event, rental) => {
    event.preventDefault()
    setError('')
    setSavingRentalId(rental._id)

    try {
      const form = new FormData(event.target)
      const removedKeys = removedEntriesByRental[rental._id] || []
      const regularItems = []
      const tableclothItems = []

      const addEntry = (entry, quantity) => {
        const item = entry.item || entry
        const itemId = item._id || item
        const target = item.category === 'מפות' ? tableclothItems : regularItems
        const existing = target.find((candidate) => candidate.item === itemId)
        if (existing) existing.quantity += quantity
        else target.push({ item: itemId, quantity })
      }

      rental.groups.forEach((group, groupIndex) => {
        group.items.forEach((entry, itemIndex) => {
          if (removedKeys.includes(`${groupIndex}-${itemIndex}`)) return

          const value = Number(form.get(`quantity-${groupIndex}-${itemIndex}`))
          if (!Number.isFinite(value) || value < 1) {
            throw new Error('כמות לכל פריט חייבת להיות לפחות 1')
          }
          addEntry(entry, value)
        })
      })

      ;(addedEntriesByRental[rental._id] || []).forEach((entry) => {
        addEntry(entry, entry.quantity)
      })

      const nextGroups = []
      if (tableclothItems.length) nextGroups.push({ items: tableclothItems })
      if (regularItems.length) nextGroups.push({ items: regularItems })
      if (nextGroups.length === 0) throw new Error('ההזמנה חייבת להכיל לפחות פריט אחד')

      await api.put(`rentals/${rental._id}`, {
        groups: nextGroups
      })

      setEditingRentalId(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'עריכת ההזמנה נכשלה')
    } finally {
      setSavingRentalId(null)
    }
  }

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('he-IL')
  const filteredRentals = rentals.filter((rental) => {
    const eventDate = dateKey(rental.eventDate)
    const matchesDate = (!dateFrom || eventDate >= dateFrom) && (!dateTo || eventDate <= dateTo)
    const itemDetails = (rental.groups || []).flatMap((group) => (group.items || []).map(({ item }) => (
      [item?.code, item?.title, item?.category, item?.subcategory].filter(Boolean).join(' ')
    ))).join(' ')
    const searchableText = [
      rental.user?.name,
      rental.user?.email,
      itemDetails,
      labels[rental.status] || rental.status
    ].filter(Boolean).join(' ').toLocaleLowerCase('he-IL')
    return matchesDate && searchableText.includes(normalizedSearch)
  })

  return (
    <AdminShell title='השאלות' description='צפייה בהזמנות ועדכון מצב הטיפול בהן.'>
      {loading && <p className='admin-state is-loading' role='status'>טוען השאלות...</p>}
      {!loading && error && <p className='error-message' role='alert'>{error}</p>}
      {!loading && !error && rentals.length === 0 && <p className='admin-state is-empty' role='status'>אין הזמנות עדיין.</p>}
      {!loading && !error && rentals.length > 0 && (
        <>
          <section className='admin-rentals-toolbar' aria-label='חיפוש וסינון השאלות'>
            <label className='admin-rentals-search'>
              <span>חיפוש</span>
              <input
                type='search'
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='לקוח, אימייל, כלי או סטטוס'
              />
            </label>
            <label className='admin-rentals-date-filter'>
              <span>מתאריך אירוע</span>
              <input type='date' value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label className='admin-rentals-date-filter'>
              <span>עד תאריך אירוע</span>
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

          <p className='admin-rentals-count' aria-live='polite'>מציג {filteredRentals.length} מתוך {rentals.length} השאלות</p>
        </>
      )}
      {!loading && !error && rentals.length > 0 && (filteredRentals.length === 0 ? (
        <p className='admin-state is-empty' role='status'>לא נמצאו השאלות התואמות לחיפוש ולתאריכים.</p>
      ) : <ul className='admin-rentals-list'>
        {filteredRentals.map((rental) => <li key={rental._id} className='admin-rental-card'>
          <div className='order-header'>
            <div>
              <h2>אירוע ב-{date(rental.eventDate)}</h2>
                <p className='admin-rental-status'><strong>סטטוס:</strong> <span className={`status-badge status-${rental.status}`}>{labels[rental.status] || rental.status}</span></p>
            </div>
            <div className='admin-rental-actions'>
              <button type='button' className='admin-secondary-btn' onClick={() => editingRentalId === rental._id ? setEditingRentalId(null) : startEditing(rental)}>{editingRentalId === rental._id ? 'ביטול' : 'עריכה'}</button>
              {(actions[rental.status] || []).map(([status, text]) => <button key={status} type='button' className='admin-status-btn' onClick={() => update(rental._id, status)}>{text}</button>)}
            </div>
          </div>

          {editingRentalId === rental._id ? (
            <form className='admin-form admin-rental-edit-form' onSubmit={(event) => saveEdit(event, rental)}>
              <p><strong>תאריך אירוע:</strong> {date(rental.eventDate)}</p>
              {rental.groups?.map((group, groupIndex) => (
                <div key={`${rental._id}-${groupIndex}`} className='order-group'>
                  <p><strong>איסוף:</strong> {date(group.pickupDate)} | <strong>החזרה:</strong> {date(group.returnDate)}</p>
                  <ul className='order-items-list'>
                    {group.items?.map((entry, itemIndex) => (
                      !(removedEntriesByRental[rental._id] || []).includes(`${groupIndex}-${itemIndex}`) && <li key={`${entry.item?._id || entry.item}-${itemIndex}`} className='order-item-row'>
                        <div className='order-item-image-wrap'>
                          {entry.item?.images?.[0] && <img src={getUploadUrl(entry.item.images[0])} alt={entry.item.code || entry.item.title || 'פריט'} className='order-item-image' />}
                        </div>
                        <div className='order-item-text'>
                          <h4>{entry.item?.code || entry.item?.title || 'פריט'}</h4>
                          <p>
                            {availabilityLoading
                              ? 'טוען מלאי לתאריך...'
                              : `זמין במלאי לתאריך: ${availabilityByItemId[entry.item?._id]?.availableQuantity ?? 0}`}
                          </p>
                          <label>
                            כמות
                            <input name={`quantity-${groupIndex}-${itemIndex}`} type='number' min='1' defaultValue={entry.quantity} required />
                          </label>
                          <button type='button' className='admin-secondary-btn' onClick={() => removeEntry(rental._id, groupIndex, itemIndex)}>הורד מההזמנה</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {(addedEntriesByRental[rental._id] || []).length > 0 && (
                <div className='admin-rental-added-items'>
                  <h3>פריטים שיוספו</h3>
                  <ul className='order-items-list'>
                    {(addedEntriesByRental[rental._id] || []).map((entry) => (
                      <li key={entry.item._id} className='order-item-row'>
                        <div className='order-item-text'>
                          <h4>{entry.item.code || entry.item.title}</h4>
                          <p>כמות: {entry.quantity}</p>
                          <button
                            type='button'
                            className='admin-secondary-btn'
                            onClick={() => setAddedEntriesByRental((prev) => ({
                              ...prev,
                              [rental._id]: (prev[rental._id] || []).filter((candidate) => candidate.item._id !== entry.item._id)
                            }))}
                          >
                            בטל הוספה
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className='admin-rental-add-item'>
                <h3>הוספת פריט לפי קוד</h3>
                <div className='admin-rental-add-fields'>
                  <label>
                    קוד
                    <input
                      type='text'
                      value={addCodeByRental[rental._id] || ''}
                      onChange={(event) => setAddCodeByRental((prev) => ({ ...prev, [rental._id]: event.target.value }))}
                      placeholder='לדוגמה: 123'
                    />
                  </label>
                  <label>
                    כמות
                    <input
                      type='number'
                      min='1'
                      value={addQuantityByRental[rental._id] || 1}
                      onChange={(event) => setAddQuantityByRental((prev) => ({ ...prev, [rental._id]: event.target.value }))}
                    />
                  </label>
                  <button type='button' className='admin-secondary-btn' onClick={() => addItemByCode(rental)}>הוסף להזמנה</button>
                </div>
              </div>

              <div className='admin-item-actions'>
                <button type='submit' disabled={savingRentalId === rental._id}>{savingRentalId === rental._id ? 'שומר...' : 'שמור'}</button>
                <button type='button' className='admin-secondary-btn' onClick={() => setEditingRentalId(null)}>ביטול</button>
              </div>
            </form>
          ) : (
            <>
              <section className='order-customer-box'>
                <h3>פרטי המזמין</h3>
                <p><strong>שם:</strong> {rental.user?.name || 'לא ידוע'}</p>
                <p><strong>אימייל:</strong> {rental.user?.email || 'לא קיים'}</p>
                {rental.user?.phone && <p><strong>טלפון:</strong> {rental.user.phone}</p>}
              </section>

              {rental.groups?.map((group, index) => <div key={`${rental._id}-${index}`} className='order-group'>
                <p><strong>איסוף:</strong> {date(group.pickupDate)} | <strong>החזרה:</strong> {date(group.returnDate)}</p>
                <ul className='order-items-list'>{group.items?.map((entry) => <li key={entry.item?._id || entry.item} className='order-item-row'>
                  <div className='order-item-image-wrap'>
                    {entry.item?.images?.[0] && <img src={getUploadUrl(entry.item.images[0])} alt={entry.item.code || entry.item.title || 'פריט'} className='order-item-image' />}
                  </div>
                  <div className='order-item-text'>
                    <h4>{entry.item?.code || entry.item?.title || 'פריט'}</h4>
                    <p>{entry.item?.category}{entry.item?.subcategory && ` > ${entry.item.subcategory}`}</p>
                    {entry.item?.size && <p>גודל: {entry.item.size}</p>}
                    {entry.item?.material && <p>חומר: {entry.item.material}</p>}
                    <p>כמות: {entry.quantity}</p>
                  </div>
                </li>)}</ul>
              </div>)}
            </>
          )}
        </li>)}
      </ul>)}
    </AdminShell>
  )
}

export default AdminRentals