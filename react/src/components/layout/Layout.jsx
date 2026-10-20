import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Chat from '../Chat'

const Layout = () => {
    const { pathname } = useLocation()
    const isHomePage = pathname === '/'

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return (
        <>
            <Header />
            {!isHomePage && (
                <div className='home-marquee' aria-label='השאלה לאירועים'>
                    <div className='home-marquee-track'>
                        <div className='home-marquee-group'>
                            <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                            <span>כל מה שצריך לשולחן אירוע מושלם</span><b>✦</b>
                            <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                            <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                            <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                            <span>כל מה שצריך לשולחן אירוע מושלם</span><b>✦</b>
                            <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                            <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                        </div>
                        <div className='home-marquee-group' aria-hidden='true'>
                            <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                            <span>כל מה שצריך לשולחן אירוע מושלם</span><b>✦</b>
                            <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                            <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                            <span>פרטים קטנים. רגעים גדולים.</span><b>✦</b>
                            <span>כל מה שצריך לשולחן אירוע מושלם</span><b>✦</b>
                            <span>בוחרים. משתמשים. מחזירים.</span><b>✦</b>
                            <span>אירוח יפה, פשוט ונגיש.</span><b>✦</b>
                        </div>
                    </div>
                </div>
            )}
            <Outlet />
            <Chat />
            <footer className='site-footer'>
                <span>גמח כלים בית וגן</span>
                <Link to='/terms'>תקנון השאלה</Link>
            </footer>
        </>
    )
}

export default Layout
