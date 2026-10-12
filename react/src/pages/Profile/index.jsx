import { Outlet, NavLink, useLocation } from 'react-router-dom'

const Profile = () => {
  const location = useLocation()
  const isAccountPage = location.pathname.endsWith('/account')

  if (isAccountPage) {
    return <Outlet />
  }

  return (
    <main className='profile-layout'>
      <section className='profile-landing-intro'>
        <p className='eyebrow'>החשבון שלכם, במקום אחד</p>
        <h1>אזור אישי</h1>
        <p>התחברו או הירשמו כדי לצפות בפרטים האישיים שלכם ולנהל את ההזמנות.</p>
      </section>
      <Outlet />
    </main>
  )
}

export default Profile
