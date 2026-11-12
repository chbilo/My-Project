import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AuthContext } from './AuthContext'
import api from '../api/axios'

const CHAIR_COVERS_LIMIT = 60

const isChairCover = (item) =>
  item.category === 'מפות' && item.subcategory === 'כיסויים לכסאות'

const getChairCoverQuantity = (items) =>
  items.reduce((total, item) => total + (isChairCover(item) ? Number(item.quantity) || 0 : 0), 0)

const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  cartLoading: false
})

const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext)
  const [items, setItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)
  const isCartLoadedRef = useRef(false)

  // Load the user's cart from the server when the authenticated user changes.
  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      isCartLoadedRef.current = false
      if (!user) {
        setItems([])
        isCartLoadedRef.current = true
        setCartLoading(false)
        return
      }

      setCartLoading(true)
      try {
        const res = await api.get('cart')
        if (!cancelled) {
          setItems(res.data)
          isCartLoadedRef.current = true
        }
      } catch (err) {
        if (!cancelled) {
          setItems([])
          isCartLoadedRef.current = true
        }
        console.error('Failed to load cart', err)
      } finally {
        if (!cancelled) setCartLoading(false)
      }
    }

    sync()
    return () => { cancelled = true }
  }, [user])

  // Persist cart changes on the server for authenticated users.
  useEffect(() => {
    if (!user) return

    const persist = async () => {
      if (!isCartLoadedRef.current) return
      try {
        await api.put('cart', { items })
      } catch (err) {
        console.error('Failed to persist cart to server', err)
      }
    }
    persist()
  }, [items, user])

  const addItem = (item, quantity = 1) => {
    if (!user) return false
    if (!item?._id || quantity < 1) return false

    setItems((prev) => {
      const existing = prev.find((entry) => entry.itemId === item._id)
      const otherChairCoverQuantity = getChairCoverQuantity(
        prev.filter((entry) => entry.itemId !== item._id)
      )
      const chairCoverQuantityLimit = isChairCover(item)
        ? Math.max(0, CHAIR_COVERS_LIMIT - otherChairCoverQuantity)
        : quantity

      if (existing) {
        return prev.map((entry) =>
          entry.itemId === item._id
            ? {
                ...entry,
                quantity: entry.maxQuantity > 0
                  ? Math.min(entry.maxQuantity, chairCoverQuantityLimit, entry.quantity + quantity)
                  : Math.min(chairCoverQuantityLimit, entry.quantity + quantity)
              }
            : entry
        )
      }

      const quantityToAdd = isChairCover(item)
        ? Math.min(quantity, chairCoverQuantityLimit)
        : quantity
      if (quantityToAdd < 1) return prev

      return [
        ...prev,
        {
          itemId: item._id,
          title: item.code || item.title,
          code: item.code || item.title,
          quantity: quantityToAdd,
          image: item.images?.[0] || null,
          category: item.category,
          subcategory: item.subcategory || '',
          variantGroupId: item.variantGroupId || '',
          size: item.size || '',
          variantLabel: item.variantLabel || '',
          variantType: item.variantType || 'גודל',
          material: item.material || '',
          extraRentalFee: Number(item.extraRentalFee) || 0,
          maxQuantity: item.quantity
        }
      ]
    })

    return true
  }

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((entry) => entry.itemId !== itemId))
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeItem(itemId)
      return
    }

    setItems((prev) => {
      const currentItem = prev.find((entry) => entry.itemId === itemId)
      const chairCoverQuantityLimit = currentItem && isChairCover(currentItem)
        ? CHAIR_COVERS_LIMIT - getChairCoverQuantity(prev.filter((entry) => entry.itemId !== itemId))
        : quantity

      return prev.map((entry) =>
        entry.itemId === itemId
          ? {
              ...entry,
              quantity: entry.maxQuantity > 0
                ? Math.min(quantity, entry.maxQuantity, chairCoverQuantityLimit)
                : Math.min(quantity, chairCoverQuantityLimit)
            }
          : entry
      )
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, entry) => sum + entry.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, cartLoading }}
    >
      {children}
    </CartContext.Provider>
  )
}

export { CartContext, CartProvider }