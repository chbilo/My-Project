import { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getUploadUrl } from '../../api/axios'
import { AuthContext } from '../../contexts/AuthContext'
import { CartContext } from '../../contexts/CartContext'
import DatePicker from '../../components/DatePicker'
import mapsHeadingImage from '../../assets/3.png'
import centersHeadingImage from '../../assets/2 (1).png'
import barToolsHeadingImage from '../../assets/1.png'
import addIcon from '../../assets/icons/add.gif'
import {
  getCategoryBySlug,
  getCategoryPath,
  ITEM_CATEGORIES,
  getItemLabel
} from '../../constants/itemCategories'

const categoryHeadingImages = {
  maps: mapsHeadingImage,
  'table-centers': centersHeadingImage,
  'bar-tools': barToolsHeadingImage
}

const Items = () => {
  const { categorySlug } = useParams()
  const category = getCategoryBySlug(categorySlug)
  const { user } = useContext(AuthContext)
  const { addItem } = useContext(CartContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedColors, setSelectedColors] = useState([])
  const [availableColors, setAvailableColors] = useState([])
  const [selectedSubcategories, setSelectedSubcategories] = useState([])
  const [availableSubcategories, setAvailableSubcategories] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [eventDateFilter, setEventDateFilter] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState({})
  const [quantities, setQuantities] = useState({})
  const [selectedVariantIds, setSelectedVariantIds] = useState({})
  const [addedItemId, setAddedItemId] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      setError('')

      try {
        const params = eventDateFilter ? { eventDate: eventDateFilter } : {}
        const response = await api.get('items', { params })
        setItems(response.data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'לא ניתן לטעון מוצרים')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [eventDateFilter])

  useEffect(() => {
    setSelectedColors([])
    setSelectedSubcategories([])
    setSearchQuery('')
    setSelectedVariantIds({})
  }, [categorySlug])

  useEffect(() => {
    if (!category) return

    const colorsSet = new Set()
    const subcategoriesSet = new Set()
    items
      .filter((item) => item.category === category.name)
      .forEach((item) => {
        item.colors?.forEach((color) => colorsSet.add(color))
        if (item.subcategory) subcategoriesSet.add(item.subcategory)
      })
    setAvailableColors(Array.from(colorsSet).sort())
    setAvailableSubcategories(Array.from(subcategoriesSet).sort())
  }, [items, category])

  if (!category) {
    return (
      <main className='items-page'>
        <h1>קטגוריה לא נמצאה</h1>
        <p>בחרו קטגוריה מהתפריט למעלה.</p>
        <Link to={getCategoryPath(ITEM_CATEGORIES[0].slug)} className='cart-link'>
          חזרה למוצרים
        </Link>
      </main>
    )
  }

  const categoryItems = items.filter((item) => item.category === category.name)

  const handleColorChange = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color]
    )
  }

  const handleSubcategoryChange = (subcategory) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategory)
        ? prev.filter((s) => s !== subcategory)
        : [...prev, subcategory]
    )
  }

  const clearAllFilters = () => {
    setSelectedColors([])
    setSelectedSubcategories([])
    setSearchQuery('')
    setEventDateFilter('')
  }

  const goToPreviousImage = (itemId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [itemId]: prev[itemId] > 0 ? prev[itemId] - 1 : totalImages - 1
    }))
  }

  const goToNextImage = (itemId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1 < totalImages ? (prev[itemId] || 0) + 1 : 0
    }))
  }

  const itemGroups = Object.values(categoryItems.reduce((groups, item) => {
    const groupId = item.variantGroupId || item._id
    if (!groups[groupId]) groups[groupId] = { id: groupId, items: [] }
    groups[groupId].items.push(item)
    return groups
  }, {}))

  const filteredGroups = itemGroups.filter((group) => group.items.some((item) => {
    const colorMatch = selectedColors.length === 0 || selectedColors.some((color) => item.colors?.includes(color))
    const subcategoryMatch = selectedSubcategories.length === 0 || selectedSubcategories.includes(item.subcategory)
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const searchMatch = !normalizedQuery || [
      getItemLabel(item),
      item.description,
      item.subcategory,
      item.material
    ].some((value) => value?.toLowerCase().includes(normalizedQuery))
    return colorMatch && subcategoryMatch && searchMatch
  }))

  const hasActiveFilters = selectedColors.length > 0 || selectedSubcategories.length > 0 || eventDateFilter || searchQuery

  const getQuantity = (itemId) => quantities[itemId] ?? 1

  const getMaxQuantity = (item) => {
    if (eventDateFilter && item.availableQuantity != null) {
      return item.availableQuantity
    }
    return item.quantity ?? 0
  }

  const handleQuantityChange = (itemId, value, maxQuantity) => {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return

    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.min(Math.max(1, parsed), maxQuantity)
    }))
  }

  const handleAddToCart = (item) => {
    if (!user) return

    const quantity = getQuantity(item._id)
    const maxQuantity = getMaxQuantity(item)
    const itemForCart = eventDateFilter
      ? { ...item, quantity: maxQuantity }
      : item

    const added = addItem(itemForCart, quantity)
    if (!added) return

    setAddedItemId(item._id)
    setTimeout(() => setAddedItemId(null), 2000)
  }

  return (
    <main className='items-page'>
      <div className='items-catalog-layout'>
        <header className='items-catalog-heading'>
          <h1 className='sr-only'>{category.name}</h1>
          <div className='items-catalog-heading-art'>
            <img className='items-catalog-heading-image' src={categoryHeadingImages[categorySlug]} alt='' />
          </div>
        </header>

        <aside className='items-filter' aria-label='סינון מוצרים'>
          <h2>סינון</h2>

          <label className='filter-search'>
            <span>חיפוש</span>
            <input
              type='search'
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder='שם, תיאור או חומר...'
            />
          </label>

          <label className='date-filter-label'>תאריך אירוע<DatePicker value={eventDateFilter} min={today} onChange={setEventDateFilter} /></label>

          {eventDateFilter && (
            <p className='date-filter-note'>
              מוצגים רק פריטים זמינים לתאריך {eventDateFilter}
            </p>
          )}

          {availableColors.length > 0 && (
            <div className='color-options'>
              <h3>צבע</h3>
              {availableColors.map((color) => (
                <label key={color} className='color-option'>
                  <input
                    type='checkbox'
                    checked={selectedColors.includes(color)}
                    onChange={() => handleColorChange(color)}
                  />
                  <span>{color}</span>
                </label>
              ))}
            </div>
          )}

          {availableSubcategories.length > 0 && (
            <div className='subcategory-options'>
              <h3>תת-קטגוריות</h3>
              {availableSubcategories.map((subcategory) => (
                <label key={subcategory} className='subcategory-option'>
                  <input
                    type='checkbox'
                    checked={selectedSubcategories.includes(subcategory)}
                    onChange={() => handleSubcategoryChange(subcategory)}
                  />
                  <span>{subcategory}</span>
                </label>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <button
              type='button'
              onClick={clearAllFilters}
              className='clear-filters-btn'
            >
              ניקוי כל הסינונים
            </button>
          )}
        </aside>

        <div className='items-catalog-results' aria-busy={loading}>
          {loading && (
            <section className='items-grid items-skeleton-grid' aria-label='טוען מוצרים'>
              {Array.from({ length: 6 }, (_, index) => <div key={index} className='item-skeleton-card' />)}
            </section>
          )}
          {error && <p className='error-message'>{error}</p>}
          {!loading && !error && categoryItems.length === 0 && (
            <p className='empty-state'>אין מוצרים בקטגוריה זו.</p>
          )}

          {!loading && !error && categoryItems.length > 0 && filteredGroups.length === 0 && (
            <p className='empty-state'>
              {eventDateFilter && selectedColors.length > 0
                ? 'אין מוצרים זמינים לתאריך שנבחר עם הצבעים שנבחרו.'
                : eventDateFilter
                  ? 'אין מוצרים זמינים לתאריך שנבחר.'
                  : 'אין מוצרים התואמים את הצבעים שנבחרו.'}
            </p>
          )}

          <section className='items-grid'>
            {filteredGroups.map((group) => {
              const selectedItemId = selectedVariantIds[group.id] || group.items[0]._id
              const item = group.items.find((variant) => variant._id === selectedItemId) || group.items[0]
              const imageIndex = currentImageIndex[item._id] || 0
              const currentImage = item.images?.[imageIndex]
              const totalImages = item.images?.length || 0
              const maxQuantity = getMaxQuantity(item)
              const unavailableByDate = !!eventDateFilter && (!item.availableOnDate || (item.availableQuantity ?? 0) <= 0)
              const unavailable = !item.isAvailable || unavailableByDate
              const canAddToCart = !!user && !unavailable && maxQuantity > 0

              return (
                <article key={group.id} className={`item-card${unavailable ? ' item-card-disabled' : ''}`}>
                  <div className='item-card-header'>
                    <h2>
                      <Link to={`/items/${categorySlug}/${item._id}`} className='item-title-link'>
                        {getItemLabel(group.items[0])}
                      </Link>
                    </h2>
                    <p>{item.description || 'אין תיאור'}</p>
                  </div>
                  {currentImage && (
                    <div className='item-card-images'>
                      <div className='item-image-gallery'>
                        <img key={`${item._id}-${imageIndex}`} className='item-gallery-image' src={getUploadUrl(currentImage)} alt={getItemLabel(item)} />
                        {totalImages > 1 && (
                          <>
                            <button
                              className='gallery-arrow gallery-prev'
                              onClick={() => goToPreviousImage(item._id, totalImages)}
                              aria-label='תמונה קודמת'
                            >
                              ❮
                            </button>
                            <button
                              className='gallery-arrow gallery-next'
                              onClick={() => goToNextImage(item._id, totalImages)}
                              aria-label='תמונה הבאה'
                            >
                              ❯
                            </button>
                            <div className='image-counter'>
                              {imageIndex + 1} / {totalImages}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                  }
                  <div className='item-card-content'>
                    {group.items.length > 1 && (
                      <div className='item-variant-options' aria-label='בחירת גודל'>
                        <strong>גודל:</strong>
                        {group.items.map((variant) => (
                          <button
                            key={variant._id}
                            type='button'
                            className={`item-variant-option${variant._id === item._id ? ' selected' : ''}`}
                            onClick={() => setSelectedVariantIds((prev) => ({ ...prev, [group.id]: variant._id }))}
                          >
                            {variant.size || 'ללא מידה'}
                          </button>
                        ))}
                      </div>
                    )}
                    {item.size && <p><strong>גודל:</strong> {item.size}</p>}
                    {item.material && <p><strong>חומר:</strong> {item.material}</p>}
                    {item.colors && item.colors.length > 0 && (
                      <p><strong>צבעים:</strong> {item.colors.join(', ')}</p>
                    )}
                    <p><strong>מלאי כללי:</strong> {item.quantity ?? 0}</p>
                    {eventDateFilter && (
                      <p><strong>זמין לתאריך:</strong> {item.availableQuantity ?? 0}</p>
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
                              max={maxQuantity}
                              value={getQuantity(item._id)}
                              onChange={(e) => handleQuantityChange(item._id, e.target.value, maxQuantity)}
                              className='item-quantity-input'
                            />
                          </label>
                          <button
                            type='button'
                            className='add-to-cart-btn'
                            onClick={() => handleAddToCart(item)}
                          >
                            הוסף לעגלה
                          </button>
                          {addedItemId === item._id && (
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
            })}
          </section>
        </div>
      </div>
    </main >
  )
}

export default Items
