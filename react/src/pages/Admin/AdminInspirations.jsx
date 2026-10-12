import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api, { getUploadUrl } from '../../api/axios'
import AdminShell from './AdminShell'

const AdminInspirations = () => {
  const { user } = useContext(AuthContext)
  const [inspirations, setInspirations] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const load = async () => {
    setListLoading(true)
    try {
      setInspirations((await api.get('inspirations/admin')).data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'לא ניתן לטעון תמונות השראה')
    } finally {
      setListLoading(false)
    }
  }
  useEffect(() => { if (user?.role === 'admin') load() }, [user])
  if (!user || user.role !== 'admin') return <main className='admin-page'><h1>אין גישה</h1></main>

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.post('inspirations/admin', new FormData(event.target), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      event.target.reset()
      setSuccess('תמונת ההשראה נוספה בהצלחה')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'הוספת תמונת ההשראה נכשלה')
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id) => {
    setError('')
    try {
      await api.put(`inspirations/${id}`, { isPublished: true })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'אישור תמונת ההשראה נכשל')
    }
  }

  return <AdminShell title='תמונות השראה' description='ניהול התמונות שמופיעות בגלריה.'>
    <section className='admin-create'>
      <h2>הוספת תמונת השראה</h2>
      <form onSubmit={submit} className='admin-form'>
        <label>כותרת<input name='title' type='text' /></label>
        <label>תיאור<textarea name='description' rows='2' /></label>
        <label>קטגוריה<input name='category' type='text' /></label>
        <label>סדר תצוגה<input name='order' type='number' min='0' defaultValue='0' /></label>
        <label className='admin-checkbox'><input name='isPublished' type='checkbox' defaultChecked /> הצג בגלריה</label>
        <label>תמונה<input name='image' type='file' accept='image/jpeg,image/png,image/gif,image/webp' required /></label>
        <button type='submit' disabled={loading}>{loading ? 'מעלה...' : 'הוסף תמונה'}</button>
        {error && <p className='error-message'>{error}</p>}
        {success && <p className='success-message'>{success}</p>}
      </form>
    </section>
    {listLoading ? <p className='admin-state is-loading' role='status'>טוען תמונות השראה...</p> : !error && inspirations.length === 0 ? <p className='admin-state is-empty' role='status'>אין עדיין תמונות השראה.</p> : !error && <ul className='admin-inspirations-list'>{inspirations.map((item) => <li key={item._id} className='admin-inspiration-card'><img src={getUploadUrl(item.image)} alt={item.title || 'תמונת השראה'} /><h2>{item.title || 'ללא כותרת'}</h2><p>{item.category || 'ללא קטגוריה'} | {item.isPublished ? 'מאושר ומוצג' : 'ממתין לאישור'}</p>{!item.isPublished && <button type='button' className='admin-status-btn' onClick={() => approve(item._id)}>אישור והצגה בגלריה</button>}</li>)}</ul>}
  </AdminShell>
}

export default AdminInspirations