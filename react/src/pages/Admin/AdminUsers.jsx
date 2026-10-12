import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../api/axios'
import AdminShell from './AdminShell'

const formatDate = (value) => value ? new Date(value).toLocaleDateString('he-IL') : 'לא ידוע'

const AdminUsers = () => {
  const { user } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    if (user?.role !== 'admin') return

    const loadUsers = async () => {
      try {
        const response = await api.get('users')
        setUsers(response.data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'לא ניתן לטעון משתמשים')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [user])

  if (!user || user.role !== 'admin') {
    return <main className='admin-page'><h1>אין גישה</h1><p>עבור דף זה דרוש משתמש מנהל.</p></main>
  }

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('he-IL')
  const filteredUsers = users.filter((entry) => {
    const matchesRole = roleFilter === 'all' || entry.role === roleFilter
    const searchableText = `${entry.name} ${entry.email} ${entry.phone || ''}`.toLocaleLowerCase('he-IL')
    return matchesRole && searchableText.includes(normalizedSearch)
  })

  return (
    <AdminShell title='משתמשים' description='צפייה בפרטי המשתמשים ובהרשאות שלהם.'>
      {loading && <p className='admin-state is-loading' role='status'>טוען משתמשים...</p>}
      {error && <p className='error-message'>{error}</p>}
      {!loading && !error && (
        <>
          <section className='admin-users-controls' aria-label='חיפוש וסינון משתמשים'>
            <label className='admin-users-search'>
              <span>חיפוש</span>
              <input
                type='search'
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='שם, אימייל או טלפון'
              />
            </label>
            <label className='admin-users-role-filter'>
              <span>סוג משתמש</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value='all'>כולם</option>
                <option value='user'>משתמשים</option>
                <option value='admin'>מנהלים</option>
              </select>
            </label>
          </section>
          {users.length === 0 ? (
            <p className='admin-state is-empty' role='status'>עדיין לא נרשמו משתמשים.</p>
          ) : filteredUsers.length === 0 ? (
            <p className='admin-state is-empty' role='status'>לא נמצאו משתמשים התואמים לחיפוש ולסינון.</p>
          ) : (
            <>
              <p className='admin-users-count'>מציג {filteredUsers.length} מתוך {users.length} משתמשים</p>
              <div className='admin-users-table-wrap'>
                <table className='admin-users-table'>
                  <thead>
                    <tr>
                      <th scope='col'>שם</th>
                      <th scope='col'>אימייל</th>
                      <th scope='col'>טלפון</th>
                      <th scope='col'>הרשאה</th>
                      <th scope='col'>תאריך הצטרפות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((entry) => (
                      <tr key={entry._id}>
                        <th scope='row'>{entry.name}</th>
                        <td className='admin-user-email'>{entry.email}</td>
                        <td className='admin-user-phone'>{entry.phone || 'לא צוין'}</td>
                        <td><span className={`admin-user-role ${entry.role === 'admin' ? 'is-admin' : ''}`}>{entry.role === 'admin' ? 'מנהל' : 'משתמש'}</span></td>
                        <td>{formatDate(entry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </AdminShell>
  )
}

export default AdminUsers