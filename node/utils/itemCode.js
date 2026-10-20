const Item = require('../models/Item')

// קידומות קטגוריות
const CATEGORY_PREFIXES = {
  'מפות': '1',
  'מרכזי שולחן': '2',
  'כלים לבר': '3'
}

// תתי קטגוריות לפי קטגוריה - כל קטגוריה ממוספרת בנפרד מ1
// מפות (קטגוריה 1) אין לה תתי קטגוריות
const SUBCATEGORIES_BY_CATEGORY = {
  'מרכזי שולחן': {
    'נר': '1',
    'פרח': '2',
    'פמוט': '3',
    'אגרטל': '4',
    'אחר': '5'
  },
  'כלים לבר': {
    'קערה': '1',
    'הגבהה': '2',
    'מגש': '3',
    'מגש על רגל': '4',
    'אחר': '5'
  }
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getCodePrefix = (category, subcategory) => {
  const categoryPrefix = CATEGORY_PREFIXES[category]
  if (!categoryPrefix) {
    throw new Error('Invalid category')
  }

  // בדיקה אם הקטגוריה יכולה להכיל תתי קטגוריות
  const hasSubcategories = SUBCATEGORIES_BY_CATEGORY[category]

  // אם אין תתי קטגוריות בקטגוריה זו (כמו מפות)
  if (!hasSubcategories) {
    if (subcategory) {
      throw new Error(`Category "${category}" does not have subcategories`)
    }
    return `${categoryPrefix}0`
  }

  // אם צריכה תת-קטגוריה אבל לא סופקה
  if (!subcategory) {
    throw new Error(`Category "${category}" requires a subcategory`)
  }

  const subcategoryPrefix = hasSubcategories[subcategory]
  if (!subcategoryPrefix) {
    throw new Error(`Invalid subcategory "${subcategory}" for category "${category}"`)
  }

  // פורמט: קטגוריה (ספרה) + תת-קטגוריה (ספרה)
  return `${categoryPrefix}${subcategoryPrefix}`
}

const generateItemCode = async (category, subcategory, excludeId) => {
  const prefix = getCodePrefix(category, subcategory)
  // תבנית: קידומת (קטגוריה + תת-קטגוריה) + מספר סידורי (3 ספרות)
  const pattern = new RegExp(`^${escapeRegex(prefix)}(\\d{3})$`)
  const query = { code: { $regex: `^${escapeRegex(prefix)}` } }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }

  const items = await Item.find(query).select('code')
  let max = 0

  for (const item of items) {
    const match = item.code?.match(pattern)
    if (match) {
      max = Math.max(max, parseInt(match[1], 10))
    }
  }

  // פורמט סופי: קטגוריה (1 ספרה) + תת-קטגוריה/0 (1 ספרה) + מספר סידורי (3 ספרות עם אפסים)
  // דוגמאות:
  // 10001 - מפות (1), פריט 1
  // 21001 - מרכזי שולחן (2) + נר (1), פריט 1
  // 31001 - כלים לבר (3) + קערה (1), פריט 1
  // 24999 - מרכזי שולחן (2) + אגרטל (4), פריט 999
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

const shouldRegenerateCode = (item, category, subcategory) => {
  if (!item?.code) return true
  const prefix = getCodePrefix(category, subcategory)
  return !item.code.startsWith(prefix)
}

module.exports = {
  CATEGORY_PREFIXES,
  SUBCATEGORIES_BY_CATEGORY,
  getCodePrefix,
  generateItemCode,
  shouldRegenerateCode
}
