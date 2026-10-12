import { Link, Outlet } from 'react-router-dom'
import Header from './Header'
import Chat from '../Chat'

const Layout = () => {
    return (
        <>
            <Header />
            <div className='home-marquee' aria-label='השכרה לאירועים'>
                <div className='home-marquee-track'>
                    <div className='home-marquee-group'>
                        <span>אירוח שנראה כמו זיכרון</span><b>✦</b>
                        <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                        <span>כלים לבית ולגן</span><b>✦</b>
                        <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                        <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                        <span>אירוח שנראה כמו זיכרון</span><b>✦</b>
                        <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                        <span>כלים לבית ולגן</span><b>✦</b>
                        <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                        <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                    </div>
                    <div className='home-marquee-group' aria-hidden='true'>
                        <span>אירוח שנראה כמו זיכרון</span><b>✦</b>
                        <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                        <span>כלים לבית ולגן</span><b>✦</b>
                        <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                        <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                        <span>אירוח שנראה כמו זיכרון</span><b>✦</b>
                        <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                        <span>כלים לבית ולגן</span><b>✦</b>
                        <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                        <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                    </div>
                </div>
            </div>
            <Outlet />
            <Chat />
            <footer className='site-footer'>
                <span>גמח כלים בית וגן</span>
                <Link to='/terms'>תקנון השכרה</Link>
            </footer>
        </>
    )
}

export default Layout
