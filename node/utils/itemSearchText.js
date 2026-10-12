const buildItemSearchText = (item) => {
    const fields = [
        item.title && item.title !== item.code ? `שם: ${item.title}` : null,
        item.category ? `קטגוריה: ${item.category}` : null,
        item.subcategory ? `תת-קטגוריה: ${item.subcategory}` : null,
        item.description ? `תיאור: ${item.description}` : null,
        item.colors?.length ? `צבעים: ${item.colors.join(', ')}` : null,
        item.material ? `חומר: ${item.material}` : null,
        item.size ? `גודל: ${item.size}` : null
    ]

    return fields.filter(Boolean).join('. ')
}

module.exports = { buildItemSearchText }