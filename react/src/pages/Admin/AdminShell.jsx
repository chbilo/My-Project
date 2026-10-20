import { NavLink } from 'react-router-dom'

const AdminShell = ({ title, description, children, className = '' }) => (
  <main className={`admin-page ${className}`.trim()}>
    <nav className='admin-nav' aria-label='ניווט מנהל'>
      <NavLink to='/admin' end>לוח בקרה</NavLink>
      <NavLink to='/admin/rentals'>השאלות</NavLink>
      <NavLink to='/admin/occupancy'>תפוסת כלים</NavLink>
      <NavLink to='/admin/users'>משתמשים</NavLink>
      <NavLink to='/admin/items'>מוצרים</NavLink>
      <NavLink to='/admin/items/new'>מוצר חדש</NavLink>
      <NavLink to='/admin/admins/new'>מנהל חדש</NavLink>
      <NavLink to='/admin/inspirations'>תמונות השראה</NavLink>
      <NavLink to='/admin/closed-dates'>ימים סגורים</NavLink>
    </nav>
    <h1>{title}</h1>
    {description && <p>{description}</p>}
    {children}
  </main>
)

export default AdminShell