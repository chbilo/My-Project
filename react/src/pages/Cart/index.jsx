import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getUploadUrl } from '../../api/axios'
import { CartContext } from '../../contexts/CartContext'
import { AuthContext } from '../../contexts/AuthContext'
import DatePicker from '../../components/DatePicker'
import addIcon from '../../assets/icons/add.gif'

const Cart = () => {
  const { items, removeItem, updateQuantity, totalItems, clearCart, cartLoading } = useContext(CartContext)
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [eventDate, setEventDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [unavailableItems, setUnavailableItems] = useState({})
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (items.length === 0) {
      setUnavailableItems({})
      return
    }

    let cancelled = false
    const checkCurrentAvailability = async () => {
      setUnavailableItems({})
      try {
        const params = eventDate ? { eventDate } : {}
        const response = await api.get('items', { params })
        const currentItems = new Map(response.data.map((item) => [item._id, item]))
        const unavailable = items.reduce((result, item) => {
            const currentItem = currentItems.get(item.itemId)
            if (!currentItem || !currentItem.isAvailable || currentItem.quantity <= 0) {
              result[item.itemId] = 'המוצר כבר לא זמין'
            } else if (
              eventDate &&
              (!currentItem.availableOnDate || item.quantity > currentItem.availableQuantity)
            ) {
              result[item.itemId] = 'המוצר לא זמין בתאריך שנבחר'
            }
            return result
          }, {})

        if (!cancelled) setUnavailableItems(unavailable)
      } catch (err) {
        console.error('Failed to check cart availability', err)
      }
    }

    checkCurrentAvailability()
    return () => { cancelled = true }
  }, [items, eventDate])

  const handleQuantityChange = (itemId, value, maxQuantity) => {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return

    const max = maxQuantity > 0 ? maxQuantity : parsed
    updateQuantity(itemId, Math.min(Math.max(1, parsed), max))
  }

  const buildGroups = () => {
    const tablecloths = items.filter((item) => item.category === 'מפות')
    const others = items.filter((item) => item.category !== 'מפות')
    const toGroup = (list) => ({
      items: list.map((item) => ({
        item: item.itemId,
        quantity: item.quantity
      }))
    })

    const groups = []
    if (tablecloths.length) groups.push(toGroup(tablecloths))
    if (others.length) groups.push(toGroup(others))
    return groups
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setError('')

    if (!eventDate) {
      setError('יש לבחור תאריך אירוע')
      return
    }

    setSubmitting(true)
    try {
      const availabilityResponse = await api.get('items', { params: { eventDate } })
      const availableItems = new Map(
        availabilityResponse.data.map((item) => [item._id, item])
      )
      const unavailableItem = items.find((item) => {
        const currentItem = availableItems.get(item.itemId)
        return !currentItem || !currentItem.isAvailable || !currentItem.availableOnDate || item.quantity > currentItem.availableQuantity
      })

      if (unavailableItem) {
        const currentItem = availableItems.get(unavailableItem.itemId)
        setError(
          currentItem
            ? `המלאי של ${currentItem.code || currentItem.title} אינו מספיק לתאריך שנבחר. נותרו ${currentItem.availableQuantity ?? 0} יחידות.`
            : 'אחד מהמוצרים בעגלה כבר אינו זמין.'
        )
        return
      }

      await api.post('rentals', {
        eventDate,
        groups: buildGroups(),
        notes
      })
      clearCart()
      navigate('/my-orders', {
        state: {
          successMessage: 'ההזמנה נשלחה בהצלחה וממתינה לאישור.',
          showInspirationInvite: true
        }
      })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'שליחת ההזמנה נכשלה')
    } finally {
      setSubmitting(false)
    }
  }

  if (cartLoading) {
    return (
      <main className='cart-page'>
        <h1>העגלה שלי</h1>
        <p>טוען עגלה...</p>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className='cart-page'>
        <h1>העגלה שלי</h1>
        <p className='empty-state'>העגלה ריקה.</p>
        <Link to='/items/maps' className='cart-link'>לצפייה בפריטים</Link>
      </main>
    )
  }

  return (
    <main className='cart-page'>
      <h1>העגלה שלי</h1>
      <p className='cart-summary'>{totalItems} פריטים בעגלה</p>

      <ul className='cart-list'>
        {items.map((item) => (
          <li
            key={item.itemId}
            className={`cart-item${unavailableItems[item.itemId] ? ' cart-item-unavailable' : ''}`}
          >
            {item.image && (
              <img
                src={getUploadUrl(item.image)}
                alt={item.code || item.title}
                className='cart-item-image'
              />
            )}
            <div className='cart-item-details'>
              <h2>{item.code || item.title}</h2>
              {unavailableItems[item.itemId] && (
                <p className='cart-item-unavailable-message'>{unavailableItems[item.itemId]}</p>
              )}
              {item.category && <p className='cart-item-category'>{item.category}{item.subcategory && ` > ${item.subcategory}`}</p>}
              {item.size && <p className='cart-item-meta'><strong>גודל:</strong> {item.size}</p>}
              {item.material && <p className='cart-item-meta'><strong>חומר:</strong> {item.material}</p>}
              <label className='cart-quantity-label'>
                כמות
                <input
                  type='number'
                  min='1'
                  max={item.maxQuantity > 0 ? item.maxQuantity : undefined}
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.itemId, e.target.value, item.maxQuantity)}
                  className='cart-quantity-input'
                />
              </label>
              {item.maxQuantity > 0 && (
                <p className='cart-item-stock'>מלאי זמין: {item.maxQuantity}</p>
              )}
              <button
                type='button'
                className='cart-remove-btn'
                onClick={() => removeItem(item.itemId)}
              >
                הסר מהעגלה
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className='cart-actions'>
        <button type='button' className='cart-clear-btn' onClick={clearCart}>
          נקה עגלה
        </button>
        <Link to='/items/maps' className='cart-link'>הוסף עוד פריטים</Link>
      </div>

      {!user ? (
        <section className='cart-login-prompt'>
          <p>כדי לשלוח הזמנה, יש להתחבר לחשבון.</p>
          <Link to='/profile/login' className='cart-login-link nav-dropdown-link-with-icon'>
            <img className='nav-dropdown-link-icon' src={addIcon} alt='' />התחברות
          </Link>
        </section>
      ) : (
        <section className='cart-checkout'>
          <h2>שליחת הזמנה</h2>
          <form onSubmit={handleSubmitOrder} className='cart-checkout-form'>
            <label>תאריך אירוע<DatePicker value={eventDate} min={today} onChange={setEventDate} /></label>
            <label>
              הערות
              <textarea
                rows='3'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='כתובת, שעת איסוף, או כל פרט נוסף'
              />
            </label>
            {error && <p className='error-message'>{error}</p>}
            <button type='submit' disabled={submitting}>
              {submitting ? 'שולח...' : 'שלח הזמנה'}
            </button>
          </form>
        </section>
      )}
    </main>
  )
}

export default Cart
