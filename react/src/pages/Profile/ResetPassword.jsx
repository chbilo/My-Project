import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const password = formData.get('password')
    if (password !== formData.get('confirmPassword')) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('auth/reset-password', { token, password })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'לא ניתן לאפס את הסיסמה כרגע. נסו שוב מאוחר יותר.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className='auth-page reset-password-page'>
      <div className='auth-intro'>
        <p className='eyebrow'>איפוס סיסמה</p>
        <h1>סיסמה חדשה</h1>
        <p>בחרו סיסמה חדשה לחשבון. לאחר העדכון תוכלו להתחבר כרגיל.</p>
      </div>
      <form onSubmit={handleSubmit} className='auth-form reset-password-form'>
        <div className='auth-form-heading'>
          <h2>בחירת סיסמה חדשה</h2>
          <span>בחרו סיסמה חדשה לחשבון</span>
        </div>
        {message ? (
          <>
            <p className='success-message' role='status'>{message}</p>
            <Link to='/profile/login' className='auth-primary-button reset-password-submit'>להתחברות</Link>
          </>
        ) : (
          <>
            <label>
              סיסמה חדשה
              <input type='password' name='password' autoComplete='new-password' minLength='8' maxLength='72' aria-describedby='password-hint' required />
              <span className='reset-password-hint' id='password-hint'>לפחות 8 תווים</span>
            </label>
            <label>
              אימות סיסמה
              <input type='password' name='confirmPassword' autoComplete='new-password' minLength='8' maxLength='72' required />
            </label>
            {error && <p className='error-message' role='alert'>{error}</p>}
            {!token && <p className='error-message' role='alert'>קישור האיפוס חסר. בקשו קישור חדש.</p>}
            <button type='submit' className='auth-primary-button reset-password-submit' disabled={loading || !token}>
              {loading ? 'מעדכן...' : 'עדכון סיסמה'}
            </button>
          </>
        )}
        {!message && <p className='auth-switch'><Link to='/profile/forgot-password'>בקשת קישור חדש</Link></p>}
      </form>
    </section>
  )
}

export default ResetPassword
