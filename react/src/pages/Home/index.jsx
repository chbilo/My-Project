import { Link } from 'react-router-dom'
import mapsBadge from '../../assets/Pink circular Hebrew badge collection-1.png'
import centersBadge from '../../assets/Pink floral badge with transparent background-2.png'
import barToolsBadge from '../../assets/Pink Hebrew vase circle badge-3.png'

const Home = () => {
    return (
        <main className='home-page'>
            <section className='home-hero'>
                <div className='home-hero-copy'>
                    <p className='eyebrow'>השכרה לאירועים עם אופי</p>
                    <h1>הפרטים הקטנים<br />שעושים את האירוע.</h1>
                    <p className='home-hero-text'>כלים, מפות ומרכזי שולחן שנבחרו כדי להפוך שולחן יפה לזיכרון שנשאר.</p>
                    <Link to='/items/maps' className='home-primary-link'>לצפייה בקטלוג</Link>
                </div>
                <div className='home-hero-note'>
                    <span>01</span>
                    <p>בוחרים<br />מתאמים<br />נהנים</p>
                </div>
                <div className='home-hero-scroll' aria-hidden='true'>
                    <span>גלו את הקולקציה</span>
                    <i />
                </div>
            </section>
            <section className='home-badge-links' aria-label='קטגוריות מוצרים'>
                <Link to='/items/maps' className='home-badge-link'>
                    <img src={mapsBadge} alt='מפות' />
                </Link>
                <Link to='/items/table-centers' className='home-badge-link'>
                    <img src={centersBadge} alt='מרכזי שולחן' />
                </Link>
                <Link to='/items/bar-tools' className='home-badge-link'>
                    <img src={barToolsBadge} alt='כלים לבר' />
                </Link>
            </section>
        </main>
    )
}

export default Home
