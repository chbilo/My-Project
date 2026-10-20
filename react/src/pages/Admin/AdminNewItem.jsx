import { useContext, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../api/axios'
import { ITEM_CATEGORIES, getSubcategoriesByCategory } from '../../constants/itemCategories'
import AdminShell from './AdminShell'

const AdminNewItem = () => {
  const { user } = useContext(AuthContext)
  const [category, setCategory] = useState('')
  const [state, setState] = useState({ loading: false, error: '', success: '' })
  const subcategories = getSubcategoriesByCategory(category)

  if (!user || user.role !== 'admin') return <main className='admin-page'><h1>אין גישה</h1></main>

  const submit = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '', success: '' })
    const form = new FormData(event.target)
    const data = new FormData()
    for (const [key, value] of form.entries()) data.append(key, key === 'colors' ? JSON.stringify(value.split(',').map((color) => color.trim()).filter(Boolean)) : value)
    try {
      await api.post('items', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      event.target.reset(); setCategory(''); setState({ loading: false, error: '', success: 'מוצר נוצר בהצלחה' })
    } catch (err) { setState({ loading: false, error: err.response?.data?.message || err.message || 'שגיאה ביצירת מוצר', success: '' }) }
  }

  return <AdminShell title='יצירת מוצר חדש' description='הוסף מוצר חדש לקטלוג הפריטים להשאלה.'><section className='admin-create'><form onSubmit={submit} className='admin-form'>
    <label>תיאור<textarea name='description' rows='3' /></label>
    <label>קבוצת מידות<input name='variantGroupId' type='text' placeholder='אותו מזהה לכל מידות אותו מוצר' /></label>
    <label>גודל<input name='size' type='text' /></label>
    <label>חומר<input name='material' type='text' /></label>
    <label>קטגוריה<select name='category' value={category} onChange={(event) => setCategory(event.target.value)} required><option value=''>בחר קטגוריה</option>{ITEM_CATEGORIES.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}</select></label>
    {subcategories.length > 0 && <label>תת-קטגוריה<select name='subcategory' required><option value=''>בחר תת-קטגוריה</option>{subcategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>}
    <label>כמות<input name='quantity' type='number' min='0' defaultValue='0' /></label>
    <label>תמונות<input name='images' type='file' accept='image/*' multiple /></label>
    <label>צבעים (מופרדים בפסיק)<input name='colors' type='text' /></label>
    <button type='submit' disabled={state.loading}>{state.loading ? 'שולח...' : 'צור מוצר'}</button>
    {state.error && <p className='error-message'>{state.error}</p>}{state.success && <p className='success-message'>{state.success}</p>}
  </form></section></AdminShell>
}

export default AdminNewItem