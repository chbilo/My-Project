import { Link } from 'react-router-dom'
import mapsBadge from '../../assets/Pink circular Hebrew badge collection-1.png'
import centersBadge from '../../assets/Pink floral badge with transparent background-2.png'
import barToolsBadge from '../../assets/Pink Hebrew vase circle badge-3.png'

const Home = () => {
    return (
        <main className='home-page'>
            <section className='home-hero' aria-label='ברוכים הבאים לשמחת יהודית'>
                <div className='home-hero-copy'>
                    <p className='eyebrow'>השאלה לאירועים עם אופי</p>
                    <h1>הפרטים הקטנים<br />שעושים את האירוע.</h1>
                    <p className='home-hero-text'>כלים, מפות ומרכזי שולחן שנבחרו כדי להפוך שולחן יפה לזיכרון שנשאר.</p>
                    <Link to='/items/maps' className='home-primary-link'>לצפייה בקטלוג</Link>
                </div>
            </section>
            <section className='home-collections' aria-labelledby='home-collections-title'>
                <p className='eyebrow'>שמחה מתחילה בפרטים הקטנים</p>
                <h2 id='home-collections-title'>כל מה שצריך לאירוח מושלם</h2>
                <p className='home-collections-intro'>מבחר כלים ואביזרים להשאלה, כדי שתוכלו להתמקד במה שבאמת חשוב — בשמחה.</p>
                <div className='home-badge-links' aria-label='קטגוריות מוצרים'>
                    <Link to='/items/maps' className='home-badge-link'>
                        <div className='home-badge-visual'>
                            <img src={mapsBadge} alt='מפות' />
                        </div>
                        <div className='home-badge-copy'>
                            <strong>מפות</strong>
                            <span>לשולחנות מעוצבים</span>
                        </div>
                    </Link>
                    <Link to='/items/table-centers' className='home-badge-link'>
                        <div className='home-badge-visual'>
                            <img src={centersBadge} alt='מרכזי שולחן' />
                        </div>
                        <div className='home-badge-copy'>
                            <strong>מרכזי שולחן</strong>
                            <span>למראה של אירוע מושלם</span>
                        </div>
                    </Link>
                    <Link to='/items/bar-tools' className='home-badge-link'>
                        <div className='home-badge-visual'>
                            <img src={barToolsBadge} alt='כלים לבר' />
                        </div>
                        <div className='home-badge-copy'>
                            <strong>כלים לבר</strong>
                            <span>ללחיים, קוקטיילים ומרגוע</span>
                        </div>
                    </Link>
                </div>
            </section>
        </main>
    )
}

export default Home
