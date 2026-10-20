export const ITEM_CATEGORIES = [
  {
    slug: 'maps',
    name: 'מפות',
    rentalLabel: 'מפות וכיסויים',
    rentalFee: 20,
    prefix: 'MP',
    subcategories: []
  },
  {
    slug: 'table-centers',
    name: 'מרכזי שולחן',
    rentalLabel: 'מרכזי שולחן',
    rentalFee: 30,
    prefix: 'MS',
    subcategories: [
      { name: 'אגרטל', prefix: 'AG' },
      { name: 'פמוט', prefix: 'PM' },
      { name: 'פרח', prefix: 'PR' },
      { name: 'נר', prefix: 'NR' },
      { name: 'אחר', prefix: 'OT' }
    ]
  },
  {
    slug: 'bar-tools',
    name: 'כלים לבר',
    rentalLabel: 'כלים לבר',
    rentalFee: 50,
    prefix: 'KB',
    subcategories: [
      { name: 'קערה', prefix: 'KR' },
      { name: 'הגבהה', prefix: 'HG' },
      { name: 'מגש', prefix: 'MZ' },
      { name: 'מגש על רגל', prefix: 'MR' },
      { name: 'אחר', prefix: 'OT' }
    ]
  }
]

export const getCategoryBySlug = (slug) =>
  ITEM_CATEGORIES.find((category) => category.slug === slug)

export const getCategoryPath = (slug) => `/items/${slug}`

export const getSubcategoriesByCategory = (categoryName) => {
  const category = ITEM_CATEGORIES.find(cat => cat.name === categoryName)
  return (category?.subcategories || []).map((subcategory) =>
    typeof subcategory === 'string' ? subcategory : subcategory.name
  )
}

export const getItemLabel = (item) => item?.code || item?.title || 'פריט'
