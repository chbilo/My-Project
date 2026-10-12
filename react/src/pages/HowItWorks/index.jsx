import { Link } from 'react-router-dom'
import oneIcon from '../../assets/icons/one-transparent.webp'
import twoIcon from '../../assets/icons/two-transparent.webp'
import threeIcon from '../../assets/icons/three-transparent.webp'
import fourIcon from '../../assets/icons/four-transparent.webp'

const steps = [
  {
    number: '01',
    icon: oneIcon,
    title: 'בוחרים פריטים',
    text: 'עוברים בקטלוג, מסננים לפי קטגוריה ובוחרים את הכלים שמתאימים לאירוע.'
  },
  {
    number: '02',
    icon: twoIcon,
    title: 'בודקים זמינות',
    text: 'בוחרים תאריך אירוע ומקבלים תמונה עדכנית של המלאי הזמין לתאריך הזה.'
  },
  {
    number: '03',
    icon: threeIcon,
    title: 'שולחים הזמנה',
    text: 'מוסיפים את הפריטים לעגלה, ממלאים את פרטי האירוע ושולחים בקשה לאישור.'
  },
  {
    number: '04',
    icon: fourIcon,
    title: 'אוספים ומחזירים',
    text: 'מקבלים את פרטי האיסוף וההחזרה באזור האישי ועוקבים אחר סטטוס ההזמנה.'
  }
]

const HowItWorks = () => {
  return (
    <main className='how-it-works-page'>
      <section className='how-it-works-intro'>
        <div>
          <p className='eyebrow'>פשוט, ברור, מסודר</p>
          <h1>איך זה עובד?</h1>
        </div>
        <p className='how-it-works-lead'>
          כל מה שצריך כדי לתכנן שולחן יפה לאירוע שלכם, במקום אחד.
        </p>
      </section>

      <section className='how-it-works-steps' aria-label='שלבי ההזמנה'>
        {steps.map((step) => (
          <article key={step.number} className='how-it-works-step'>
            <span className='how-it-works-number'>
              <img src={step.icon} alt={`שלב ${Number(step.number)}`} />
            </span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <section className='how-it-works-actions'>
        <h2>מוכנים להתחיל?</h2>
        <div>
          <Link to='/items/maps' className='how-it-works-primary'>לצפייה בקטלוג</Link>
          <Link to='/contact' className='how-it-works-secondary'>יש לכם שאלה?</Link>
        </div>
      </section>
    </main>
  )
}

export default HowItWorks
