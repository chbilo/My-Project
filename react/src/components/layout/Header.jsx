import { useContext, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import { CartContext } from '../../contexts/CartContext'
import { ITEM_CATEGORIES } from '../../constants/itemCategories'
import homeIcon from '../../assets/icons/home.gif'
import phoneIcon from '../../assets/icons/phone.gif'
import cameraIcon from '../../assets/icons/photo-camera.gif'
import saladIcon from '../../assets/icons/salad.gif'
import shoppingCartIcon from '../../assets/icons/shopping-cart-transparent.webp'
import tableIcon from '../../assets/icons/table.gif'
import profileIcon from '../../assets/icons/profile.gif'
import vasesIcon from '../../assets/icons/vases.gif'
import questionIcon from '../../assets/icons/question.gif'
import cakeIcon from '../../assets/icons/cake.gif'
import addIcon from '../../assets/icons/add.gif'
import formIcon from '../../assets/icons/form.gif'
import logoutIcon from '../../assets/icons/logout.gif'
import notebookIcon from '../../assets/icons/notebook.gif'
import notepadIcon from '../../assets/icons/notepad.gif'

const UserIcon = () => <img className='nav-icon profile-menu-icon' src={profileIcon} alt='' />

const HomeMenuIcon = () => <img className='nav-menu-icon' src={homeIcon} alt='' />
const ProductsMenuIcon = () => <img className='nav-menu-icon' src={saladIcon} alt='' />
const ContactMenuIcon = () => <img className='nav-menu-icon' src={phoneIcon} alt='' />
const GalleryMenuIcon = () => <img className='nav-menu-icon' src={cameraIcon} alt='' />
const HowItWorksMenuIcon = () => <img className='nav-menu-icon' src={questionIcon} alt='' />

const categoryIcons = {
    maps: tableIcon,
    'table-centers': vasesIcon,
    'bar-tools': cakeIcon
}

const Header = () => {
    const { user, logout } = useContext(AuthContext)
    const { totalItems } = useContext(CartContext)
    const [productsOpen, setProductsOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [cartBump, setCartBump] = useState(false)
    const productsDropdownRef = useRef(null)
    const profileDropdownRef = useRef(null)
    const previousTotalItems = useRef(totalItems)
    const location = useLocation()

    const handleLogout = () => {
        logout()
    }

    const toggleProductsMenu = () => {
        setProductsOpen((prev) => !prev)
    }

    const toggleProfileMenu = () => {
        setProfileOpen((prev) => !prev)
    }

    useEffect(() => {
        setProductsOpen(false)
        setProfileOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (totalItems > previousTotalItems.current) {
            setCartBump(true)
            const timeoutId = setTimeout(() => setCartBump(false), 700)
            previousTotalItems.current = totalItems
            return () => clearTimeout(timeoutId)
        }
        previousTotalItems.current = totalItems
    }, [totalItems])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
                setProductsOpen(false)
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setProfileOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className='site-header'>
            <nav className='site-nav'>
                <NavLink to='/' className='site-brand' aria-label='גמח כלים בית וגן'>
                    <span className='site-brand-mark'>ג</span>
                    <span>גמח כלים בית וגן</span>
                </NavLink>
                <NavLink to='/'><HomeMenuIcon />בית</NavLink>

                <div className='nav-dropdown' ref={productsDropdownRef}>
                    <button
                        type='button'
                        className='nav-dropdown-trigger'
                        onClick={toggleProductsMenu}
                        aria-expanded={productsOpen}
                        aria-label='פתיחת קטגוריות מוצרים'
                    >
                        <ProductsMenuIcon />
                        <span className='nav-dropdown-label'>מוצרים</span>
                        <span className='nav-dropdown-arrow' aria-hidden='true'>{productsOpen ? '▲' : '▼'}</span>
                    </button>
                    {productsOpen && (
                        <div className='nav-dropdown-menu'>
                            {ITEM_CATEGORIES.map((category) => {
                                const categoryIcon = categoryIcons[category.slug]
                                return (
                                    <NavLink
                                        key={category.slug}
                                        to={`/items/${category.slug}`}
                                        className={`nav-dropdown-link${categoryIcon ? ' category-with-icon' : ''}`}
                                        onClick={() => setProductsOpen(false)}
                                    >
                                        {categoryIcon && <img className='category-menu-icon' src={categoryIcon} alt='' />}
                                        {category.name}
                                    </NavLink>
                                )
                            })}
                        </div>
                    )}
                </div>

                <NavLink to='/contact'><ContactMenuIcon />צור קשר</NavLink>
                <NavLink to='/gallery'><GalleryMenuIcon />גלריה</NavLink>
                <NavLink to='/how-it-works'><HowItWorksMenuIcon />איך זה עובד</NavLink>
                {user ? (
                    <div className='nav-dropdown' ref={profileDropdownRef}>
                        <button
                            type='button'
                            className='nav-dropdown-trigger'
                            onClick={toggleProfileMenu}
                            aria-expanded={profileOpen}
                            aria-label='פתיחת תפריט פרופיל'
                        >
                            <span className='nav-dropdown-label' title='אזור אישי'>
                                <UserIcon />
                                <span className='sr-only'>אזור אישי</span>
                            </span>
                            <span className='nav-dropdown-arrow' aria-hidden='true'>{profileOpen ? '▲' : '▼'}</span>
                        </button>
                        {profileOpen && (
                            <div className='nav-dropdown-menu'>
                                <NavLink to='/profile/account' className='nav-dropdown-link nav-dropdown-link-with-icon'>
                                    <img className='nav-dropdown-link-icon' src={notepadIcon} alt='' />עריכת הפרטים שלי
                                </NavLink>
                                <NavLink to='/my-orders' className='nav-dropdown-link nav-dropdown-link-with-icon'>
                                    <img className='nav-dropdown-link-icon' src={formIcon} alt='' />ההזמנות שלי
                                </NavLink>
                                {user.role === 'admin' && (
                                    <NavLink to='/admin' className='nav-dropdown-link nav-dropdown-link-with-icon'>
                                        <img className='nav-dropdown-link-icon notebook-menu-icon' src={notebookIcon} alt='' />ניהול
                                    </NavLink>
                                )}
                                <button className='nav-dropdown-link nav-dropdown-link-with-icon nav-dropdown-logout' type='button' onClick={handleLogout}>
                                    <img className='nav-dropdown-link-icon' src={logoutIcon} alt='' />התנתקות
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <NavLink to='/profile/login'><img className='nav-menu-icon' src={addIcon} alt='' />התחברות</NavLink>
                )}
                <NavLink to='/cart' className={`cart-nav-link${cartBump ? ' cart-bump' : ''}`} aria-label={`עגלה${totalItems > 0 ? `, ${totalItems} פריטים` : ''}`}>
                    <img className='nav-icon cart-image-icon' src={shoppingCartIcon} alt='' />
                    {totalItems > 0 && <span className='cart-count'>{totalItems}</span>}
                </NavLink>
            </nav>
        </header>
    )
}

export default Header
