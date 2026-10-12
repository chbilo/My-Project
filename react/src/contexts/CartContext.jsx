import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AuthContext } from './AuthContext'
import api from '../api/axios'

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

      if (existing) {
        return prev.map((entry) =>
          entry.itemId === item._id
            ? {
                ...entry,
                quantity: entry.maxQuantity > 0
                  ? Math.min(entry.maxQuantity, entry.quantity + quantity)
                  : entry.quantity + quantity
              }
            : entry
        )
      }

      return [
        ...prev,
        {
          itemId: item._id,
          title: item.code || item.title,
          code: item.code || item.title,
          quantity,
          image: item.images?.[0] || null,
          category: item.category,
          subcategory: item.subcategory || '',
          variantGroupId: item.variantGroupId || '',
          size: item.size || '',
          material: item.material || '',
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

    setItems((prev) =>
      prev.map((entry) =>
        entry.itemId === itemId
          ? {
              ...entry,
              quantity: entry.maxQuantity > 0
                ? Math.min(quantity, entry.maxQuantity)
                : quantity
            }
          : entry
      )
    )
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