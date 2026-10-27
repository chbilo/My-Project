import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

const ForgotPassword = () => {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('auth/forgot-password', {
        email: new FormData(event.currentTarget).get('email')
      })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'לא ניתן לשלוח את הבקשה כרגע. נסו שוב מאוחר יותר.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className='auth-page'>
      <div className='auth-intro'>
        <p className='eyebrow'>איפוס סיסמה</p>
        <h1>נשלח קישור</h1>
        <p>הזינו את כתובת המייל המשויכת לחשבון ונשלח אליה קישור לאיפוס הסיסמה.</p>
      </div>
      <form onSubmit={handleSubmit} className='auth-form'>
        <div className='auth-form-heading'>
          <h2>שכחתם סיסמה?</h2>
          <span>הקישור יהיה תקף למשך 15 דקות</span>
        </div>
        {message ? (
          <p role='status'>{message}</p>
        ) : (
          <>
            <label>
              אימייל
              <input type='email' name='email' placeholder='name@example.com' autoComplete='email' required />
            </label>
            {error && <p className='error-message' role='alert'>{error}</p>}
            <button type='submit' className='auth-primary-button' disabled={loading}>
              {loading ? 'שולח...' : 'שליחת קישור איפוס'}
            </button>
          </>
        )}
        <p className='auth-switch'><Link to='/profile/login'>חזרה להתחברות</Link></p>
      </form>
    </section>
  )
}

export default ForgotPassword
