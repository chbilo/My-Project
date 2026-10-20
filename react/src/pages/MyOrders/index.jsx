import { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api, { getUploadUrl } from '../../api/axios'
import { AuthContext } from '../../contexts/AuthContext'
import messageIcon from '../../assets/icons/message.gif'
import emailIcon from '../../assets/icons/email.gif'
import truckIcon from '../../assets/icons/truck.gif'
import stopIcon from '../../assets/icons/stop.gif'
import cancelledIcon from '../../assets/icons/invalid (1).gif'
import addIcon from '../../assets/icons/add.gif'
import verifiedIcon from '../../assets/icons/verified.gif'

const STATUS_LABELS = {
  pending: 'נשלחה לאישור',
  approved: 'אושרה',
  rejected: 'נדחתה',
  picked_up: 'נאספה',
  returned: 'הוחזרה',
  cancelled: 'בוטלה'
}

const STATUS_STEPS = ['pending', 'approved', 'picked_up', 'returned']
const STATUS_ICONS = {
  submitted: messageIcon,
  created: messageIcon,
  pending: messageIcon,
  approved: emailIcon,
  picked_up: truckIcon,
  returned: verifiedIcon,
  rejected: stopIcon,
  cancelled: cancelledIcon
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('he-IL')
}

const MyOrders = () => {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const loadRentals = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('rentals')
      setRentals(response.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'לא ניתן לטעון הזמנות')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadRentals()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleCancel = async (rentalId) => {
    if (!window.confirm('האם לבטל את ההזמנה?')) return

    setActionError('')
    try {
      await api.put(`rentals/${rentalId}`, { status: 'cancelled' })
      await loadRentals()
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'ביטול ההזמנה נכשל')
    }
  }

  if (!user) {
    return (
      <main className='orders-page'>
        <h1>ההזמנות שלי</h1>
        <p>יש להתחבר כדי לראות הזמנות.</p>
        <Link to='/profile/login' className='cart-link nav-dropdown-link-with-icon'>
          <img className='nav-dropdown-link-icon' src={addIcon} alt='' />התחברות
        </Link>
      </main>
    )
  }

  return (
    <main className='orders-page'>
      <h1>ההזמנות שלי</h1>
      {loading && <p>טוען הזמנות...</p>}
      {location.state?.successMessage && (
        <p className='success-message'>{location.state.successMessage}</p>
      )}
      {location.state?.rentalCostBreakdown?.length > 0 && (
        <section className='order-cost-summary' aria-label='חישוב עלות ההזמנה'>
          <h2>סכום לתשלום עבור ההזמנה</h2>
          <ul>
            {location.state.rentalCostBreakdown.map((category) => (
              <li key={category.name}>
                <span>{category.label} (ללא הגבלת כמות)</span>
                <strong>{category.fee} ש"ח</strong>
              </li>
            ))}
          </ul>
          <p className='cart-rental-cost-total'>
            <span>סה"כ לתשלום</span>
            <strong>{location.state.totalRentalCost} ש"ח</strong>
          </p>
          <p className='cart-rental-equation'>
            חישוב: {location.state.rentalCostBreakdown.map((category) => category.fee).join(' + ')} = {location.state.totalRentalCost} ש"ח
          </p>
        </section>
      )}
      {location.state?.showInspirationInvite && (
        <section className='order-success-box'>
          <h2>שמחים שהזמנתם מאיתנו!</h2>
          <p>נשמח לראות איך האירוע שלכם נראה. תוכלו לשתף תמונות מהאירוע, והן יופיעו בגלריית ההשראה לאחר אישור מנהל.</p>
          <Link to='/gallery' className='order-success-link'>העלאת תמונות מהאירוע</Link>
        </section>
      )}
      {error && <p className='error-message'>{error}</p>}
      {actionError && <p className='error-message'>{actionError}</p>}

      {!loading && !error && rentals.length === 0 && (
        <p className='empty-state'>אין עדיין הזמנות. <Link to='/items/maps' className='cart-link'>לקטלוג</Link></p>
      )}

      <ul className='orders-list'>
        {rentals.map((rental) => (
          <li key={rental._id} className='order-card'>
            <div className='order-header'>
              <div>
                <h2>אירוע ב-{formatDate(rental.eventDate)}</h2>
                <p className='order-status-label'><strong>סטטוס:</strong> <span className={`status-badge status-${rental.status}`}>{STATUS_LABELS[rental.status] || rental.status}</span></p>
              </div>
              {rental.status === 'pending' && (
                <button
                  type='button'
                  className='order-cancel-btn'
                  onClick={() => handleCancel(rental._id)}
                >
                  בטל הזמנה
                </button>
              )}
            </div>

            <div
              className={`order-status-timeline${['rejected', 'cancelled'].includes(rental.status) ? ` order-status-timeline-${rental.status}` : ''}`}
              aria-label={['rejected', 'cancelled'].includes(rental.status) ? `סטטוס ההזמנה: ${STATUS_LABELS[rental.status]}` : 'התקדמות ההזמנה'}
            >
              {(rental.status === 'rejected'
                ? [
                    { status: 'submitted', label: 'נשלחה לאישור' },
                    { status: 'rejected', label: STATUS_LABELS.rejected }
                  ]
                : rental.status === 'cancelled'
                  ? [
                      { status: 'created', label: 'הזמנה נפתחה' },
                      { status: 'cancelled', label: STATUS_LABELS.cancelled }
                    ]
                  : STATUS_STEPS.map((step) => ({ status: step, label: STATUS_LABELS[step] }))
              ).map((step, index) => {
                const isTerminalTimeline = ['rejected', 'cancelled'].includes(rental.status)
                const isComplete = isTerminalTimeline
                  ? index === 0
                  : STATUS_STEPS.indexOf(rental.status) >= index && rental.status !== 'cancelled'
                const isCurrent = isTerminalTimeline
                  ? step.status === rental.status
                  : rental.status === step.status
                const isTerminalStep = isTerminalTimeline && step.status === rental.status
                const statusIcon = STATUS_ICONS[step.status]
                return (
                  <div key={step.status} className={`order-status-step${isComplete ? ' complete' : ''}${isCurrent ? ' current' : ''}${isTerminalStep ? ` ${rental.status}` : ''}${statusIcon ? ' has-status-icon' : ''}`}>
                    <span>
                      {statusIcon
                        ? <img className='order-status-icon' src={statusIcon} alt='' />
                        : isTerminalStep ? '×' : index + 1}
                    </span>
                    <strong>{step.label}</strong>
                  </div>
                )
              })}
            </div>

            <section className='order-customer-box'>
              <h3>פרטי המזמין</h3>
              <p><strong>שם:</strong> {rental.user?.name || 'לא ידוע'}</p>
              <p><strong>אימייל:</strong> {rental.user?.email || 'לא קיים'}</p>
              {rental.user?.phone && <p><strong>טלפון:</strong> {rental.user.phone}</p>}
            </section>

            {rental.notes && <p className='order-note'><strong>הערות:</strong> {rental.notes}</p>}

            {rental.groups?.map((group, index) => (
              <div key={`${rental._id}-${index}`} className='order-group'>
                <p><strong>איסוף:</strong> {formatDate(group.pickupDate)} | <strong>החזרה:</strong> {formatDate(group.returnDate)}</p>
                <ul className='order-items-list'>
                  {group.items?.map((entry) => (
                    <li key={entry.item?._id || entry.item} className='order-item-row'>
                      <div className='order-item-image-wrap'>
                        {entry.item?.images?.[0] && (
                          <img src={getUploadUrl(entry.item.images[0])} alt={entry.item.code || entry.item.title || 'פריט'} className='order-item-image' />
                        )}
                      </div>
                      <div className='order-item-text'>
                        <h4>{entry.item?.code || entry.item?.title || 'פריט'}</h4>
                        <p>{entry.item?.category}{entry.item?.subcategory && ` > ${entry.item.subcategory}`}</p>
                        {entry.item?.size && <p>גודל: {entry.item.size}</p>}
                        {entry.item?.material && <p>חומר: {entry.item.material}</p>}
                        <p>כמות: {entry.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default MyOrders
