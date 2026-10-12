import { useContext, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../api/axios'
import AdminShell from './AdminShell'

const AdminNewAdmin = () => {
  const { user } = useContext(AuthContext)
  const [state, setState] = useState({ loading: false, error: '', success: '' })

  if (!user || user.role !== 'admin') return <main className='admin-page'><h1>אין גישה</h1></main>

  const submit = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '', success: '' })
    try {
      await api.post('auth/register-admin', Object.fromEntries(new FormData(event.target).entries()))
      event.target.reset()
      setState({ loading: false, error: '', success: 'מנהל נוצר בהצלחה' })
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || error.message || 'שגיאה ביצירת מנהל', success: '' })
    }
  }

  return (
    <AdminShell title='יצירת מנהל חדש' description='הוסף משתמש עם הרשאות מנהל למערכת.'>
      <section className='admin-create'>
        <form onSubmit={submit} className='admin-form'>
          <label>שם מלא<input name='name' type='text' required /></label>
          <label>אימייל<input name='email' type='email' required /></label>
          <label>סיסמה<input name='password' type='password' required /></label>
          <label>טלפון<input name='phone' type='tel' /></label>
          <button type='submit' disabled={state.loading}>{state.loading ? 'שולח...' : 'צור מנהל'}</button>
          {state.error && <p className='error-message'>{state.error}</p>}
          {state.success && <p className='success-message'>{state.success}</p>}
        </form>
      </section>
    </AdminShell>
  )
}

export default AdminNewAdmin