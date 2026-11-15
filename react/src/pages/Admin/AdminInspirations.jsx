import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api, { getUploadUrl } from '../../api/axios'
import AdminShell from './AdminShell'

const isVideo = (item) => item.mediaType === 'video'

const AdminInspirations = () => {
  const { user } = useContext(AuthContext)
  const [inspirations, setInspirations] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [savingId, setSavingId] = useState(null)
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
  if (!user || user.role !== 'admin') return <main id='main-content' tabIndex={-1} className='admin-page'><h1>אין גישה</h1></main>

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
    setSuccess('')
    try {
      await api.put(`inspirations/${id}`, { isPublished: true })
      setSuccess('תמונת ההשראה אושרה ונוספה בגלריה')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'אישור תמונת ההשראה נכשל')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('למחוק את תמונת ההשראה? המחיקה אינה ניתנת לביטול.')) return

    setError('')
    setSuccess('')
    setDeletingId(id)
    try {
      await api.delete(`inspirations/${id}`)
      setSuccess('תמונת ההשראה נמחקה בהצלחה')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'מחיקת תמונת ההשראה נכשלה')
    } finally {
      setDeletingId(null)
    }

    const update = async (event, id) => {
      event.preventDefault()
      setError('')
      setSuccess('')
      setSavingId(id)
      try {
        const formData = new FormData(event.target)
        formData.set('isPublished', event.target.elements.isPublished.checked ? 'true' : 'false')
        await api.put(`inspirations/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setEditingId(null)
        setSuccess('תמונת ההשראה עודכנה בהצלחה')
        await load()
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'עדכון תמונת ההשראה נכשל')
      } finally {
        setSavingId(null)
      }
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
        <label>תמונה או וידאו<input name='image' type='file' accept='image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime' required /></label>
        <button type='submit' disabled={loading}>{loading ? 'מעלה...' : 'הוסף תמונה'}</button>
        {error && <p className='error-message' role='alert'>{error}</p>}
        {success && <p className='success-message' role='status'>{success}</p>}
      </form>
    </section>
    {listLoading ? <p className='admin-state is-loading' role='status'>טוען תמונות השראה...</p> : !error && inspirations.length === 0 ? <p className='admin-state is-empty' role='status'>אין עדיין תמונות השראה.</p> : !error && <ul className='admin-inspirations-list'>
      {inspirations.map((item) => (
        <li key={item._id} className='admin-inspiration-card'>
          <div className='admin-inspiration-image-wrap'>
            {isVideo(item) ? (
              <video src={getUploadUrl(item.image)} muted playsInline preload='metadata' />
            ) : (
              <img src={getUploadUrl(item.image)} alt={item.title || 'תמונת השראה'} />
            )}
            {isVideo(item) && <span className='admin-inspiration-video-badge'>וידאו</span>}
            <button
              type='button'
              className='admin-inspiration-edit'
              onClick={() => setEditingId((current) => current === item._id ? null : item._id)}
              aria-label={`עריכת תמונת השראה ${item.title || ''}`.trim()}
            >
              {editingId === item._id ? 'סגירת עריכה' : 'עריכה'}
            </button>
            <button
              type='button'
              className='admin-delete-btn admin-inspiration-delete'
              disabled={deletingId === item._id}
              onClick={() => remove(item._id)}
              aria-label={`מחיקת תמונת השראה ${item.title || ''}`.trim()}
            >
              {deletingId === item._id ? 'מוחק...' : 'מחיקה'}
            </button>
          </div>
          <div className='admin-inspiration-info'>
            <h2>{item.title || 'ללא כותרת'}</h2>
            <p>{item.category || 'ללא קטגוריה'} | {item.isPublished ? 'מאושר ומוצג' : 'ממתין לאישור'}</p>
            <div className='admin-inspiration-actions'>
              {!item.isPublished && <button type='button' className='admin-status-btn' onClick={() => approve(item._id)}>אישור והצגה בגלריה</button>}
            </div>
            {editingId === item._id && (
              <form onSubmit={(event) => update(event, item._id)} className='admin-form admin-inspiration-edit-form'>
                <label>כותרת<input name='title' type='text' defaultValue={item.title || ''} /></label>
                <label>תיאור<textarea name='description' rows='2' defaultValue={item.description || ''} /></label>
                <label>קטגוריה<input name='category' type='text' defaultValue={item.category || ''} /></label>
                <label>סדר תצוגה<input name='order' type='number' min='0' defaultValue={item.order ?? 0} /></label>
                <label className='admin-checkbox'>
                  <input name='isPublished' type='checkbox' value='true' defaultChecked={item.isPublished} /> הצג בגלריה
                </label>
                <label>החלפת תמונה או וידאו<input name='image' type='file' accept='image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime' /></label>
                <button type='submit' disabled={savingId === item._id}>
                  {savingId === item._id ? 'שומר...' : 'שמירת שינויים'}
                </button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>}
  </AdminShell>
}

export default AdminInspirations