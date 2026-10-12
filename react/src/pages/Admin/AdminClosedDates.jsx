import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../api/axios'
import AdminShell from './AdminShell'

const formatDate = (value) => new Date(value).toLocaleDateString('he-IL')

const AdminClosedDates = () => {
  const { user } = useContext(AuthContext)
  const [dates, setDates] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [state, setState] = useState({ loading: false, error: '', success: '' })

  const load = async () => {
    setListLoading(true)
    try {
      setDates((await api.get('closed-dates')).data)
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || error.message || 'לא ניתן לטעון ימים סגורים', success: '' })
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') load()
  }, [user])

  if (!user || user.role !== 'admin') return <main className='admin-page'><h1>אין גישה</h1></main>

  const submit = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '', success: '' })
    try {
      await api.post('closed-dates', Object.fromEntries(new FormData(event.target).entries()))
      event.target.reset()
      await load()
      setState({ loading: false, error: '', success: 'היום נסגר להזמנות' })
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || error.message || 'לא ניתן לסגור את היום', success: '' })
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`closed-dates/${id}`)
      setDates((current) => current.filter((entry) => entry._id !== id))
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || error.message || 'לא ניתן לפתוח את היום', success: '' })
    }
  }

  return (
    <AdminShell title='ימים סגורים להזמנות' description='סגור ימים שבהם לא ניתן לבצע הזמנות חדשות.'>
      <section className='admin-create'>
        <form onSubmit={submit} className='admin-form'>
          <label>תאריך לסגירה<input name='date' type='date' min={new Date().toISOString().split('T')[0]} required /></label>
          <button type='submit' disabled={state.loading}>{state.loading ? 'שומר...' : 'סגור יום להזמנות'}</button>
          {state.error && <p className='error-message'>{state.error}</p>}
          {state.success && <p className='success-message'>{state.success}</p>}
        </form>
      </section>

      <section className='admin-create'>
        <h2>ימים סגורים</h2>
        {listLoading ? <p className='admin-state is-loading' role='status'>טוען ימים סגורים...</p> : dates.length === 0 ? <p className='admin-state is-empty' role='status'>אין ימים סגורים.</p> : (
          <ul className='admin-rentals-list'>
            {dates.map((entry) => (
              <li key={entry._id} className='admin-rental-card order-header'>
                <strong>{formatDate(entry.date)}</strong>
                <button type='button' className='admin-secondary-btn' onClick={() => remove(entry._id)}>פתח להזמנות</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  )
}

export default AdminClosedDates
