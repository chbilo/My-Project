import { useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'

const Login = () => {
  const { login } = useContext(AuthContext)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const data = Object.fromEntries(form.entries())
    setError('')
    setLoading(true)

    try {
      await login(data)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className='auth-page'>
      <div className='auth-intro'>
        <p className='eyebrow'>ברוכים השבים</p>
        <h1>התחברות</h1>
        <p>היכנסו כדי לצפות בהזמנות שלכם ולהמשיך לתכנן את האירוע.</p>
      </div>
      <form onSubmit={handleSubmit} className='auth-form'>
        <div className='auth-form-heading'>
          <h2>כניסה לאזור האישי</h2>
          <span>הפרטים שלכם נשמרים בצורה מאובטחת</span>
        </div>
        <label>
          אימייל
          <input type='email' name='email' placeholder='name@example.com' required />
        </label>
        <label>
          סיסמה
          <input type='password' name='password' placeholder='הקלידו סיסמה' required />
        </label>
        {error && <p className='error-message'>{error}</p>}
        <button type='submit' className='auth-primary-button' disabled={loading}>
          {loading ? 'טוען...' : 'התחבר'}
        </button>
        <p className='auth-switch'>אין לכם חשבון? <Link to='/profile/register'>להרשמה</Link></p>
      </form>
    </section>
  )
}

export default Login
