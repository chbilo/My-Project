import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import api, { getUploadUrl } from '../../api/axios'
import { ITEM_CATEGORIES, getSubcategoriesByCategory } from '../../constants/itemCategories'
import AdminShell from './AdminShell'

const AdminItems = () => {
  const { user } = useContext(AuthContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [savingItemId, setSavingItemId] = useState(null)
  const [removedImagesByItem, setRemovedImagesByItem] = useState({})
  const [reorderedImagesByItem, setReorderedImagesByItem] = useState({})

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await api.get('items')).data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'לא ניתן לטעון מוצרים')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (user?.role === 'admin') load() }, [user])

  if (!user || user.role !== 'admin') return <main className='admin-page'><h1>אין גישה</h1></main>

  const remove = async (id) => {
    if (!window.confirm('למחוק את המוצר מהקטלוג?')) return
    try { await api.delete(`items/${id}`); await load() } catch (err) { setError(err.response?.data?.message || err.message || 'מחיקת המוצר נכשלה') }
  }

  const reorderImage = (itemId, fromImage, toImage) => {
    setReorderedImagesByItem((prev) => {
      const currentItem = items.find((item) => item._id === itemId)
      const baseOrder = prev[itemId] || currentItem?.images || []
      const fromIndex = baseOrder.indexOf(fromImage)
      const toIndex = baseOrder.indexOf(toImage)

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev

      const nextOrder = [...baseOrder]
      const [movedImage] = nextOrder.splice(fromIndex, 1)
      nextOrder.splice(toIndex, 0, movedImage)

      return { ...prev, [itemId]: nextOrder }
    })
  }

  const removeExistingImage = (itemId, imagePath) => {
    setRemovedImagesByItem((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), imagePath].filter((value, index, array) => array.indexOf(value) === index)
    }))

    setReorderedImagesByItem((prev) => {
      const currentItem = items.find((item) => item._id === itemId)
      const prevOrder = prev[itemId] || currentItem?.images || []
      return { ...prev, [itemId]: prevOrder.filter((image) => image !== imagePath) }
    })
  }

  const update = async (event, id) => {
    event.preventDefault()
    setError('')
    setSavingItemId(id)
    const form = new FormData(event.target)
    const data = new FormData()
    const removedImages = removedImagesByItem[id] || []
    const orderedImages = (reorderedImagesByItem[id] || items.find((item) => item._id === id)?.images || []).filter((image) => !(removedImages || []).includes(image))
    data.append('code', form.get('code') || '')
    data.append('description', form.get('description') || '')
    data.append('variantGroupId', form.get('variantGroupId') || '')
    data.append('size', form.get('size') || '')
    data.append('material', form.get('material') || '')
    data.append('category', form.get('category') || '')
    data.append('subcategory', form.get('subcategory') || '')
    data.append('quantity', form.get('quantity') || '0')
    data.append('colors', JSON.stringify((form.get('colors') || '').split(',').map((color) => color.trim()).filter(Boolean)))
    data.append('isAvailable', form.get('isAvailable') ? 'true' : 'false')
    if (removedImages.length > 0) {
      data.append('removeImages', JSON.stringify(removedImages))
    }
    if (orderedImages.length > 0) {
      data.append('imageOrder', JSON.stringify(orderedImages))
    }
    form.getAll('images').filter((file) => file?.size > 0).forEach((file) => data.append('images', file))

    try {
      await api.put(`items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setEditingItemId(null)
      setRemovedImagesByItem((prev) => ({ ...prev, [id]: [] }))
      setReorderedImagesByItem((prev) => ({ ...prev, [id]: [] }))
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'עדכון המוצר נכשל')
    } finally {
      setSavingItemId(null)
    }
  }

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('he-IL')
  const filteredItems = items.filter((item) => {
    const searchableText = [
      item.code,
      item.title,
      item.category,
      item.subcategory,
      item.description,
      item.size,
      item.material,
      item.colors?.join(' ')
    ].filter(Boolean).join(' ').toLocaleLowerCase('he-IL')

    return searchableText.includes(normalizedSearch)
  })

  return (
    <AdminShell title='מוצרים בקטלוג' description='צפייה במוצרים הקיימים וניהול הקטלוג.'>
      <Link className='admin-primary-link' to='/admin/items/new'>+ הוספת מוצר</Link>
      {!loading && !error && items.length > 0 && (
        <label className='admin-items-search'>
          <span>חיפוש מוצר</span>
          <input
            type='search'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='קוד, שם, קטגוריה, חומר או צבע'
          />
        </label>
      )}
      {loading && <p className='admin-state is-loading' role='status'>טוען מוצרים...</p>}
      {!loading && error && <p className='error-message'>{error}</p>}
      {!loading && !error && items.length === 0 && <p className='admin-state is-empty' role='status'>אין מוצרים עדיין.</p>}
      {!loading && !error && items.length > 0 && filteredItems.length === 0 && <p className='admin-state is-empty' role='status'>לא נמצאו מוצרים התואמים לחיפוש.</p>}
      {!loading && !error && filteredItems.length > 0 && <ul className='admin-items-list'>
        {filteredItems.map((item) => {
          const isAvailable = item.isAvailable !== false
          return (
            <li key={item._id} className={`admin-item-card ${isAvailable ? '' : 'admin-item-card-disabled'}`}>
              <div className='admin-item-summary'>
                {item.images?.[0] && <img src={getUploadUrl(item.images[0])} alt={item.code || 'מוצר'} className='admin-item-thumb' />}
                <div>
                  <h2>{item.code || item.title || 'מוצר ללא קוד'}</h2>
                  <p>{item.category}{item.subcategory && ` > ${item.subcategory}`} | כמות: {item.quantity ?? 0}</p>
                  <span className={`admin-item-status ${isAvailable ? 'available' : 'unavailable'}`}>{isAvailable ? 'זמין' : 'לא זמין'}</span>
                </div>
              </div>
              {editingItemId === item._id ? (
                <form className='admin-form' onSubmit={(event) => update(event, item._id)}>
                  <label>קוד מוצר<input name='code' type='text' defaultValue={item.code || ''} required /></label>
                  <label>תיאור<textarea name='description' rows='2' defaultValue={item.description || ''} /></label>
                  <label>קבוצת מידות<input name='variantGroupId' type='text' defaultValue={item.variantGroupId || ''} /></label>
                  <label>גודל<input name='size' type='text' defaultValue={item.size || ''} /></label>
                  <label>חומר<input name='material' type='text' defaultValue={item.material || ''} /></label>
                  <label>קטגוריה<select name='category' defaultValue={item.category || ''} required>{ITEM_CATEGORIES.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}</select></label>
                  <label>תת-קטגוריה<select name='subcategory' defaultValue={item.subcategory || ''}><option value=''>ללא תת-קטגוריה</option>{getSubcategoriesByCategory(item.category).map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}</select></label>
                  <label>כמות<input name='quantity' type='number' min='0' defaultValue={item.quantity ?? 0} /></label>
                  <label>צבעים (מופרדים בפסיק)<input name='colors' type='text' defaultValue={(item.colors || []).join(', ')} /></label>
                  <label className='admin-checkbox'><input name='isAvailable' type='checkbox' defaultChecked={item.isAvailable !== false} /> זמין להשאלה</label>

                  <div className='admin-image-gallery'>
                    {(reorderedImagesByItem[item._id] || item.images || []).filter((image) => !(removedImagesByItem[item._id] || []).includes(image)).map((image) => (
                      <div
                        key={image}
                        className='admin-image-preview'
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', image)
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          const draggedImage = event.dataTransfer.getData('text/plain') || image
                          if (draggedImage && draggedImage !== image) {
                            reorderImage(item._id, draggedImage, image)
                          }
                        }}
                      >
                        <img src={getUploadUrl(image)} alt={item.code || 'תמונת מוצר'} />
                        <button type='button' className='admin-image-remove' onClick={() => removeExistingImage(item._id, image)} aria-label='מחיקת תמונה'>×</button>
                      </div>
                    ))}
                  </div>

                  <label>הוסף תמונות<input name='images' type='file' accept='image/*' multiple /></label>
                  <div className='admin-item-actions'>
                    <button type='submit' disabled={savingItemId === item._id}>{savingItemId === item._id ? 'שומר...' : 'שמור'}</button>
                    <button type='button' className='admin-secondary-btn' onClick={() => { setEditingItemId(null); setRemovedImagesByItem((prev) => ({ ...prev, [item._id]: [] })) }}>ביטול</button>
                  </div>
                </form>
              ) : (
                <div className='admin-item-actions'>
                  <button type='button' onClick={() => setEditingItemId(item._id)}>עריכה</button>
                  <button type='button' className='admin-delete-btn' onClick={() => remove(item._id)}>מחיקה</button>
                </div>
              )}
            </li>
          )
        })}
      </ul>}
    </AdminShell>
  )
}

export default AdminItems