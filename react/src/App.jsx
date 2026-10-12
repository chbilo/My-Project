import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home/index'
import Items from './pages/Items/index'
import ItemDetails from './pages/ItemDetails/index'
import Contact from './pages/Contact/index'
import Profile from './pages/Profile/index'
import Login from './pages/Profile/Login'
import Register from './pages/Profile/Register'
import Account from './pages/Profile/Account'
import AdminHome from './pages/Admin/AdminHome'
import AdminRentals from './pages/Admin/AdminRentals'
import AdminOccupancy from './pages/Admin/AdminOccupancy'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminItems from './pages/Admin/AdminItems'
import AdminNewItem from './pages/Admin/AdminNewItem'
import AdminNewAdmin from './pages/Admin/AdminNewAdmin'
import AdminInspirations from './pages/Admin/AdminInspirations'
import AdminClosedDates from './pages/Admin/AdminClosedDates'
import Cart from './pages/Cart/index'
import MyOrders from './pages/MyOrders/index'
import Gallery from './pages/Gallery/index'
import HowItWorks from './pages/HowItWorks/index'
import Terms from './pages/Terms/index'

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<Home />} />
            <Route path='items'>
              <Route index element={<Navigate to='maps' replace />} />
              <Route path=':categorySlug/:itemId' element={<ItemDetails />} />
              <Route path=':categorySlug' element={<Items />} />
            </Route>
            <Route path='cart' element={<Cart />} />
            <Route path='my-orders' element={<MyOrders />} />
            <Route path='contact' element={<Contact />} />
            <Route path='gallery' element={<Gallery />} />
            <Route path='chat' element={<Navigate to='/' replace />} />
            <Route path='how-it-works' element={<HowItWorks />} />
            <Route path='terms' element={<Terms />} />
            <Route path='profile' element={<Profile />}>
              <Route index element={<Navigate to='login' replace />} />
              <Route path='login' element={<Login />} />
              <Route path='register' element={<Register />} />
              <Route path='account' element={<Account />} />
            </Route>
            <Route path='admin'>
              <Route index element={<AdminHome />} />
              <Route path='rentals' element={<AdminRentals />} />
              <Route path='occupancy' element={<AdminOccupancy />} />
              <Route path='users' element={<AdminUsers />} />
              <Route path='items' element={<AdminItems />} />
              <Route path='items/new' element={<AdminNewItem />} />
              <Route path='admins/new' element={<AdminNewAdmin />} />
              <Route path='inspirations' element={<AdminInspirations />} />
              <Route path='closed-dates' element={<AdminClosedDates />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
