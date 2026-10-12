import { useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import addIcon from '../../assets/icons/add.gif'

const Register = () => {
    const { register } = useContext(AuthContext)
    const [errTxt, setErrTxt] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        const form = new FormData(e.target)
        const data = Object.fromEntries(form.entries())
        try {
            await register(data)
        } catch (error) {
            setErrTxt(error.message)
        }
    }

    return (
        <section className='auth-page'>
            <div className='auth-intro'>
                <p className='eyebrow'>מתחילים כאן</p>
                <h1>הרשמה</h1>
                <p>צרו חשבון אישי, שמרו את ההזמנות שלכם ותכננו את האירוע בנוחות.</p>
            </div>
            <form onSubmit={handleSubmit} className='auth-form'>
                <div className='auth-form-heading'>
                    <h2>יצירת חשבון חדש</h2>
                    <span>כמה פרטים קצרים וזהו, אתם בפנים</span>
                </div>
                <label>
                    שם מלא
                    <input name='name' type='text' required />
                </label>
                <label>
                    אימייל
                    <input name='email' type='email' required />
                </label>
                <label>
                    סיסמה
                    <input name='password' type='password' required />
                </label>
                <label>
                    טלפון
                    <input name='phone' type='tel' />
                </label>
                <button type='submit' className='auth-primary-button'>יצירת חשבון</button>
                {errTxt && <p className='error-message'>{errTxt}</p>}
                <p className='auth-switch'>כבר יש לכם חשבון? <Link to='/profile/login'><img className='nav-dropdown-link-icon' src={addIcon} alt='' />להתחברות</Link></p>
            </form>
        </section>
    )
}

export default Register
