import { Link } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../api/axios'
import AdminShell from './AdminShell'

const cards = [
  { to: '/admin/rentals', title: 'השכרות', text: 'צפייה בהזמנות ועדכון הסטטוס שלהן.' },
  { to: '/admin/occupancy', title: 'תפוסת כלים', text: 'בדיקת מועדי איסוף והחזרה של כל כלי.' },
  { to: '/admin/users', title: 'משתמשים', text: 'צפייה ברשימת המשתמשים ובהרשאות שלהם.' },
  { to: '/admin/items', title: 'מוצרים', text: 'צפייה, עריכה ומחיקה של מוצרי הקטלוג.' },
  { to: '/admin/items/new', title: 'מוצר חדש', text: 'הוספת מוצר חדש לקטלוג.' },
  { to: '/admin/admins/new', title: 'מנהל חדש', text: 'יצירת משתמש מנהל נוסף.' },
  { to: '/admin/inspirations', title: 'תמונות השראה', text: 'ניהול התמונות שמופיעות בגלריה.' },
  { to: '/admin/closed-dates', title: 'ימים סגורים', text: 'ניהול ימים שבהם לא ניתן לבצע השכרות.' }
]

const AdminHome = () => {
  const { user } = useContext(AuthContext)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') return undefined

    let isActive = true
    const loadSummary = async () => {
      try {
        const [usersResponse, rentalsResponse, itemsResponse] = await Promise.all([
          api.get('users'),
          api.get('rentals'),
          api.get('items')
        ])
        if (!isActive) return

        const items = itemsResponse.data
        setSummary({
          users: usersResponse.data.length,
          pendingRentals: rentalsResponse.data.filter((rental) => rental.status === 'pending').length,
          items: items.length,
          availableItems: items.filter((item) => item.isAvailable !== false).length
        })
      } catch (err) {
        if (isActive) setSummaryError(err.response?.data?.message || err.message || 'לא ניתן לטעון את נתוני הסיכום')
      } finally {
        if (isActive) setSummaryLoading(false)
      }
    }

    loadSummary()
    return () => { isActive = false }
  }, [user])

  if (!user || user.role !== 'admin') {
    return <main className='admin-page'><h1>אין גישה</h1><p>עבור דף זה דרוש משתמש מנהל.</p></main>
  }

  return (
    <AdminShell
      title='לוח בקרה למנהל'
      description='כל מה שצריך כדי לנהל את הקטלוג וההשכרות במקום אחד.'
      className='admin-home-page'
    >
      <section className='admin-metrics' aria-label='נתוני האתר' aria-busy={summaryLoading}>
        {summaryLoading ? (
          <p className='admin-state is-loading' role='status'>טוען נתוני אתר...</p>
        ) : summaryError ? (
          <p className='error-message'>{summaryError}</p>
        ) : (
          <>
            <Link to='/admin/users' className='admin-metric-card'>
              <span>משתמשים</span>
              <strong>{summary.users.toLocaleString('he-IL')}</strong>
            </Link>
            <Link to='/admin/rentals' className='admin-metric-card'>
              <span>ממתינות לאישור</span>
              <strong>{summary.pendingRentals.toLocaleString('he-IL')}</strong>
            </Link>
            <Link to='/admin/items' className='admin-metric-card'>
              <span>מוצרים בקטלוג</span>
              <strong>{summary.items.toLocaleString('he-IL')}</strong>
            </Link>
            <Link to='/admin/items' className='admin-metric-card'>
              <span>מוצרים זמינים</span>
              <strong>{summary.availableItems.toLocaleString('he-IL')}</strong>
            </Link>
          </>
        )}
      </section>
      <div className='admin-dashboard-section-heading'>
        <span>פעולות מהירות</span>
        <p>גישה ישירה לאזורים החשובים בניהול האתר.</p>
      </div>
      <section className='admin-dashboard-grid'>
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className='admin-dashboard-card'>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </Link>
        ))}
      </section>
    </AdminShell>
  )
}

export default AdminHome