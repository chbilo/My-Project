import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../api/axios'
import DatePicker from '../../components/DatePicker'
import mapsHeadingImage from '../../assets/3.png'
import centersHeadingImage from '../../assets/2.png'
import barToolsHeadingImage from '../../assets/1.png'
import mapsBadge from '../../assets/Pink circular Hebrew badge collection-1.png'
import centersBadge from '../../assets/Pink floral badge with transparent background-2.png'
import barToolsBadge from '../../assets/Pink Hebrew vase circle badge-3.png'
import ItemCard from './ItemCard'
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

const categoryCircleImages = {
  maps: mapsBadge,
  'table-centers': centersBadge,
  'bar-tools': barToolsBadge
}

const Items = () => {
  const { categorySlug } = useParams()
  const category = getCategoryBySlug(categorySlug)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedColors, setSelectedColors] = useState([])
  const [availableColors, setAvailableColors] = useState([])
  const [selectedSubcategories, setSelectedSubcategories] = useState([])
  const [availableSubcategories, setAvailableSubcategories] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [eventDateFilter, setEventDateFilter] = useState('')
  const [colorOptionsOpen, setColorOptionsOpen] = useState(false)
  const [subcategoryOptionsOpen, setSubcategoryOptionsOpen] = useState(false)

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

  const categoryItems = items
    .filter((item) => item.category === category.name)
    .sort((left, right) => (left.code || '').localeCompare(right.code || '', 'he', { numeric: true }))

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
  const hasVisibleChairCovers = filteredGroups.some((group) =>
    group.items.some((item) => item.category === 'מפות' && item.subcategory === 'כיסויים לכסאות')
  )

  return (
    <main className='items-page'>
      <div className='items-catalog-layout'>
        <header className='items-catalog-heading'>
          <h1 className='sr-only'>{category.name}</h1>
          <div className='items-catalog-heading-art'>
            <img className='items-catalog-heading-image' src={categoryHeadingImages[categorySlug]} alt='' />
          </div>
          <p className='items-catalog-cost'>
            עלות: {category.rentalLabel} — {category.rentalFee} ש"ח ללא הגבלה
          </p>
          {categorySlug === 'maps' && (
            <p className='items-catalog-color-note' role='note'>
              שימו לב: הצבעים במציאות עשויים להיות לא בדיוק כמו בתמונה.
              אפשר להגיע ולראות דוגמא לצבע המקורי.
            </p>
          )}
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

          <label className='date-filter-label'>תאריך אירוע<DatePicker value={eventDateFilter} min={today} onChange={setEventDateFilter} showCalendarDetails={false} /></label>

          {eventDateFilter && (
            <p className='date-filter-note'>
              מוצגים רק פריטים זמינים לתאריך {eventDateFilter}
            </p>
          )}

          {availableColors.length > 0 && (
            <div className='color-options'>
              <button
                type='button'
                className='filter-section-toggle'
                aria-expanded={colorOptionsOpen}
                aria-controls='color-filter-options'
                onClick={() => setColorOptionsOpen((open) => !open)}
              >
                <span>צבע</span>
                <span className='filter-section-arrow' aria-hidden='true' />
              </button>
              {colorOptionsOpen && (
                <div id='color-filter-options' className='filter-section-options color-filter-options'>
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
            </div>
          )}

          {availableSubcategories.length > 0 && (
            <div className='subcategory-options'>
              <button
                type='button'
                className='filter-section-toggle'
                aria-expanded={subcategoryOptionsOpen}
                aria-controls='subcategory-filter-options'
                onClick={() => setSubcategoryOptionsOpen((open) => !open)}
              >
                <span>תת-קטגוריות</span>
                <span className='filter-section-arrow' aria-hidden='true' />
              </button>
              {subcategoryOptionsOpen && (
                <div id='subcategory-filter-options' className='filter-section-options subcategory-filter-options'>
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
            {filteredGroups.map((group) => (
              <ItemCard
                key={group.id}
                product={group}
                categorySlug={categorySlug}
                eventDateFilter={eventDateFilter}
              />
            ))}
          </section>
          {hasVisibleChairCovers && (
            <p className='chair-covers-order-limit' role='note'>
              ניתן להזמין עד 60 כיסויים בהזמנה אחת
            </p>
          )}
        </div>
      </div>

      <nav className='category-circle-links' aria-label='קטגוריות נוספות'>
        {ITEM_CATEGORIES.filter((entry) => entry.slug !== category.slug).map((entry) => (
          <Link
            key={entry.slug}
            to={getCategoryPath(entry.slug)}
            className='category-circle-link'
          >
            <span className='category-circle-visual'>
              <img src={categoryCircleImages[entry.slug]} alt='' />
            </span>
            <span className='category-circle-label'>{entry.name}</span>
          </Link>
        ))}
      </nav>
    </main >
  )
}

export default Items
