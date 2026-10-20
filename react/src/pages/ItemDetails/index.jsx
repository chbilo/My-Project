import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getUploadUrl } from '../../api/axios'
import { getCategoryBySlug, getCategoryPath, getItemLabel } from '../../constants/itemCategories'

const ItemDetails = () => {
  const { itemId } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    const loadItem = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`items/${itemId}`)
        setItem(response.data)
        setSelectedImageIndex(0)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'לא ניתן לטעון את פרטי המוצר')
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [itemId])

  if (loading) {
    return <main className='item-details-page'><div className='item-details-skeleton' aria-label='טוען פרטי מוצר' /></main>
  }

  if (error || !item) {
    return (
      <main className='item-details-page'>
        <p className='error-message'>{error || 'המוצר לא נמצא'}</p>
        <Link to='/items/maps' className='cart-link'>חזרה למוצרים</Link>
      </main>
    )
  }

  const images = item.images || []
  const selectedImage = images[selectedImageIndex] || images[0]

  return (
    <main className='item-details-page'>
      <Link
        to={getCategoryPath(getCategoryBySlug(item.category)?.slug || 'maps')}
        className='cart-link'
      >
        חזרה לקטגוריה
      </Link>
      <article className='item-details-card'>
        <div className='item-details-media'>
          {selectedImage ? (
            <img src={getUploadUrl(selectedImage)} alt={getItemLabel(item)} className='item-details-image' />
          ) : (
            <div className='item-details-image-placeholder'>אין תמונה למוצר</div>
          )}
          {images.length > 1 && (
            <div className='item-details-thumbnails' aria-label='בחירת תמונת מוצר'>
              {images.map((image, index) => (
                <button
                  key={image}
                  type='button'
                  className={`item-details-thumbnail${index === selectedImageIndex ? ' selected' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`תמונה ${index + 1}`}
                >
                  <img src={getUploadUrl(image)} alt='' />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className='item-details-content'>
          <p className={`item-details-status${item.isAvailable ? ' available' : ' unavailable'}`}>
            {item.isAvailable ? 'זמין להשאלה' : 'לא זמין כרגע'}
          </p>
          <h1>{getItemLabel(item)}</h1>
          <p className='item-details-description'>{item.description || 'אין תיאור'}</p>
          <div className='item-details-meta'>
            {item.size && <div><span>גודל</span><strong>{item.size}</strong></div>}
            {item.material && <div><span>חומר</span><strong>{item.material}</strong></div>}
            {item.subcategory && <div><span>קטגוריה</span><strong>{item.subcategory}</strong></div>}
            <div><span>מלאי</span><strong>{item.quantity ?? 0}</strong></div>
          </div>
          {item.colors?.length > 0 && (
            <div className='item-details-colors'>
              <span>צבעים</span>
              <div>{item.colors.map((color) => <b key={color}>{color}</b>)}</div>
            </div>
          )}
        </div>
      </article>
    </main>
  )
}

export default ItemDetails
