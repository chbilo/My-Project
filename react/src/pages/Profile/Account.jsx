import { useContext, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'

const Account = () => {
  const { user, updateProfile } = useContext(AuthContext)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!user) return null

  const startEdit = () => {
    setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' })
    setError('')
    setSuccess('')
    setEditing(true)
  }

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateProfile(form)
      setSuccess('הפרטים עודכנו בהצלחה')
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='profile-page'>
      <header className='profile-heading'>
        <div className='profile-avatar' aria-hidden='true'>
          {(user.name || '?').charAt(0)}
        </div>
        <div>
          <p className='eyebrow'>האזור האישי</p>
          <h1>הפרטים האישיים שלי</h1>
          <p>כאן אפשר לעדכן את פרטי הקשר ולנהל את החשבון.</p>
        </div>
      </header>

      {!editing ? (
        <section className='profile-card'>
          <div className='profile-card-header'>
            <div>
              <span className='profile-card-kicker'>פרטי חשבון</span>
              <h2>{user.name}</h2>
            </div>
            <span className='profile-role'>{user.role === 'admin' ? 'מנהל' : 'לקוח'}</span>
          </div>
          <div className='profile-detail-row'>
            <strong>שם מלא:</strong>
            <span>{user.name}</span>
          </div>
          <div className='profile-detail-row'>
            <strong>אימייל:</strong>
            <span>{user.email}</span>
          </div>
          <div className='profile-detail-row'>
            <strong>טלפון:</strong>
            <span>{user.phone || 'לא צויין'}</span>
          </div>
          <div className='profile-detail-row'>
            <strong>תפקיד:</strong>
            <span>{user.role}</span>
          </div>
          <div className='profile-card-actions'>
            <button type='button' className='profile-primary-button' onClick={startEdit}>ערוך פרטים</button>
          </div>
        </section>
      ) : (
        <form className='profile-form' onSubmit={handleSubmit}>
          <div className='profile-form-heading'>
            <span className='profile-card-kicker'>עריכת חשבון</span>
            <h2>עדכון פרטים</h2>
          </div>
          <label>
            שם מלא
            <input name='name' value={form.name} onChange={handleChange} required />
          </label>
          <label>
            אימייל
            <input name='email' type='email' value={form.email} onChange={handleChange} required />
          </label>
          <label>
            טלפון
            <input name='phone' value={form.phone} onChange={handleChange} />
          </label>
          {error && <p className='error-message'>{error}</p>}
          {success && <p className='success-message'>{success}</p>}
          <div className='profile-form-actions'>
            <button type='submit' className='profile-primary-button' disabled={loading}>{loading ? 'שומר...' : 'שמור שינויים'}</button>
            <button type='button' className='profile-secondary-button' onClick={() => setEditing(false)}>ביטול</button>
          </div>
        </form>
      )}
    </main>
  )
}

export default Account
