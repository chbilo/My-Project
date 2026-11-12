import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUploadUrl } from '../../api/axios'
import { getItemLabel } from '../../constants/itemCategories'
import { AuthContext } from '../../contexts/AuthContext'
import { CartContext } from '../../contexts/CartContext'
import addIcon from '../../assets/icons/add.gif'

const CHAIR_COVERS_LIMIT = 60
const CHAIR_COVERS_STOCK_DISPLAY = 60
const isChairCover = (item) =>
  item.category === 'מפות' && item.subcategory === 'כיסויים לכסאות'

const ItemCard = ({
  product,
  categorySlug,
  eventDateFilter
}) => {
  const { user } = useContext(AuthContext)
  const { addItem } = useContext(CartContext)
  const [selectedItemId, setSelectedItemId] = useState(product.items[0]._id)
  const [imageIndex, setImageIndex] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const item = product.items.find((variant) => variant._id === selectedItemId) || product.items[0]

  useEffect(() => {
    setSelectedItemId(product.items[0]._id)
    setQuantity(1)
  }, [product.id])

  const currentImageIndex = imageIndex[item._id] || 0
  const maxQuantity = eventDateFilter && item.availableQuantity != null
    ? item.availableQuantity
    : item.quantity ?? 0
  const orderLimit = isChairCover(item) ? CHAIR_COVERS_LIMIT : maxQuantity
  const displayedMaxQuantity = Math.min(maxQuantity, orderLimit)
  const unavailableByDate = !!eventDateFilter && (!item.availableOnDate || (item.availableQuantity ?? 0) <= 0)
  const unavailable = !item.isAvailable || unavailableByDate
  const canAddToCart = !!user && !unavailable && maxQuantity > 0
  const currentImage = item.images?.[currentImageIndex]
  const totalImages = item.images?.length || 0

  const goToPreviousImage = () => {
    setImageIndex((prev) => ({
      ...prev,
      [item._id]: prev[item._id] > 0 ? prev[item._id] - 1 : totalImages - 1
    }))
  }

  const goToNextImage = () => {
    setImageIndex((prev) => ({
      ...prev,
      [item._id]: (prev[item._id] || 0) + 1 < totalImages ? (prev[item._id] || 0) + 1 : 0
    }))
  }

  const handleQuantityChange = (value) => {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      setQuantity(Math.min(Math.max(1, parsed), displayedMaxQuantity))
    }
  }

  const handleAddToCart = () => {
    const itemForCart = eventDateFilter
      ? { ...item, quantity: displayedMaxQuantity }
      : item

    if (!addItem(itemForCart, quantity)) return

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <article className={`item-card${unavailable ? ' item-card-disabled' : ''}`}>
      <div className='item-card-header'>
        <h2>
          <Link to={`/items/${categorySlug}/${item._id}`} className='item-title-link'>
            {getItemLabel(item)}
          </Link>
        </h2>
        <p>{item.description || 'אין תיאור'}</p>
      </div>
      {currentImage && (
        <div className='item-card-images'>
          <div className='item-image-gallery'>
            <img key={`${item._id}-${currentImageIndex}`} className='item-gallery-image' src={getUploadUrl(currentImage)} alt={getItemLabel(item)} />
            {totalImages > 1 && (
              <>
                <button
                  className='gallery-arrow gallery-prev'
                  onClick={goToPreviousImage}
                  aria-label='תמונה קודמת'
                >
                  ❮
                </button>
                <button
                  className='gallery-arrow gallery-next'
                  onClick={goToNextImage}
                  aria-label='תמונה הבאה'
                >
                  ❯
                </button>
                <div className='image-counter'>
                  {currentImageIndex + 1} / {totalImages}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className='item-card-content'>
        {product.items.length > 1 && (
          <div className='item-variant-options' aria-label={`בחירת ${product.items[0].variantType || 'גודל'}`}>
            <strong>{product.items[0].variantType || 'גודל'}:</strong>
            {product.items.map((variant) => (
              <button
                key={variant._id}
                type='button'
                className={`item-variant-option${variant._id === item._id ? ' selected' : ''}`}
                onClick={() => {
                  setSelectedItemId(variant._id)
                  setQuantity(1)
                }}
              >
                {variant.variantLabel || variant.size || 'ללא מידה'}
              </button>
            ))}
          </div>
        )}
        {item.size && <p><strong>גודל:</strong> {item.size}</p>}
        {item.material && <p><strong>חומר:</strong> {item.material}</p>}
        {Number(item.extraRentalFee) > 0 && <p><strong>תוספת לכל יחידה:</strong> {item.extraRentalFee} ש״ח</p>}
        {item.colors && item.colors.length > 0 && (
          <p><strong>צבעים:</strong> {item.colors.join(', ')}</p>
        )}
        <p><strong>מלאי כללי:</strong> {isChairCover(item) ? CHAIR_COVERS_STOCK_DISPLAY : (item.quantity ?? 0)}</p>
        {eventDateFilter && (
          <p><strong>זמין לתאריך:</strong> {isChairCover(item) ? CHAIR_COVERS_STOCK_DISPLAY : (item.availableQuantity ?? 0)}</p>
        )}
        <div className='item-card-actions'>
          {!user ? (
            <Link to='/profile/login' className='cart-link nav-dropdown-link-with-icon'>
              <img className='nav-dropdown-link-icon' src={addIcon} alt='' />התחבר כדי להוסיף לעגלה
            </Link>
          ) : canAddToCart ? (
            <>
              <label className='item-quantity-label'>
                כמות להזמנה
                <input
                  type='number'
                  min='1'
                  max={displayedMaxQuantity}
                  value={quantity}
                  onChange={(event) => handleQuantityChange(event.target.value)}
                  className='item-quantity-input'
                />
              </label>
              <button
                type='button'
                className='add-to-cart-btn'
                onClick={handleAddToCart}
              >
                הוסף לעגלה
              </button>
              {added && (
                <p className='success-message item-added-message'>נוסף לעגלה</p>
              )}
            </>
          ) : (
            <p className='item-unavailable'>
              {eventDateFilter ? 'לא זמין לתאריך שנבחר' : 'לא זמין להזמנה'}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export default ItemCard
