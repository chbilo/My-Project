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
  const [editingUserId, setEditingUserId] = useState(null)
  const [savingUserId, setSavingUserId] = useState('')
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'user' })
  const [success, setSuccess] = useState('')

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
    return <main id='main-content' tabIndex={-1} className='admin-page'><h1>אין גישה</h1><p>עבור דף זה דרוש משתמש מנהל.</p></main>
  }

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('he-IL')
  const filteredUsers = users.filter((entry) => {
    const matchesRole = roleFilter === 'all' || entry.role === roleFilter
    const searchableText = `${entry.name} ${entry.email} ${entry.phone || ''}`.toLocaleLowerCase('he-IL')
    return matchesRole && searchableText.includes(normalizedSearch)
  })

  const startEditing = (entry) => {
    setEditingUserId(entry._id)
    setEditForm({
      name: entry.name || '',
      email: entry.email || '',
      phone: entry.phone || '',
      role: entry.role || 'user'
    })
    setError('')
    setSuccess('')
  }

  const saveUser = async (event) => {
    event.preventDefault()
    setSavingUserId(editingUserId)
    setError('')
    setSuccess('')

    try {
      const response = await api.put('users', {
        id: editingUserId,
        ...editForm
      })
      setUsers((current) => current.map((entry) =>
        entry._id === editingUserId ? response.data : entry
      ))
      setEditingUserId(null)
      setSuccess('פרטי המשתמש עודכנו בהצלחה.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'עדכון המשתמש נכשל')
    } finally {
      setSavingUserId('')
    }
  }

  return (
    <AdminShell title='משתמשים' description='צפייה בפרטי המשתמשים ובהרשאות שלהם.'>
      {loading && <p className='admin-state is-loading' role='status'>טוען משתמשים...</p>}
      {error && <p className='error-message' role='alert'>{error}</p>}
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
              {success && <p className='success-message' role='status'>{success}</p>}
              {editingUserId && (
                <form className='admin-form admin-user-edit-form' onSubmit={saveUser}>
                  <h2>עריכת משתמש</h2>
                  <label>
                    שם מלא
                    <input
                      value={editForm.name}
                      onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    אימייל
                    <input
                      type='email'
                      value={editForm.email}
                      onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    טלפון
                    <input
                      type='tel'
                      value={editForm.phone}
                      onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))}
                    />
                  </label>
                  <label>
                    הרשאה
                    <select
                      value={editForm.role}
                      onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))}
                      disabled={editingUserId === user._id}
                    >
                      <option value='user'>משתמש</option>
                      <option value='admin'>מנהל</option>
                    </select>
                  </label>
                  <div className='admin-user-edit-actions'>
                    <button type='submit' disabled={savingUserId === editingUserId}>
                      {savingUserId === editingUserId ? 'שומר...' : 'שמור שינויים'}
                    </button>
                    <button type='button' className='admin-secondary-btn' onClick={() => setEditingUserId(null)}>ביטול</button>
                  </div>
                </form>
              )}
              <div className='admin-users-table-wrap'>
                <table className='admin-users-table'>
                  <thead>
                    <tr>
                      <th scope='col'>שם</th>
                      <th scope='col'>אימייל</th>
                      <th scope='col'>טלפון</th>
                      <th scope='col'>הרשאה</th>
                      <th scope='col'>תאריך הצטרפות</th>
                      <th scope='col'>פעולות</th>
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
                        <td>
                          <button type='button' className='admin-user-edit-button' onClick={() => startEditing(entry)}>
                            עריכה
                          </button>
                        </td>
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