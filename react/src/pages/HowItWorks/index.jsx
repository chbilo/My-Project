import { Link } from 'react-router-dom'
import oneIcon from '../../assets/icons/one-transparent.webp'
import twoIcon from '../../assets/icons/two-transparent.webp'
import threeIcon from '../../assets/icons/three-transparent.webp'
import fourIcon from '../../assets/icons/four-transparent.webp'

const steps = [
  {
    number: '01',
    icon: oneIcon,
    title: 'בוחרים תאריך ופריטים',
    text: 'בוחרים תאריך לאירוע ומשריינים מפות, כלים או כיסויי כיסאות לפי הצורך.'
  },
  {
    number: '02',
    icon: twoIcon,
    title: 'מתקשרים לקבלת אישור',
    text: 'לאחר שריון הפריטים מתקשרים לגמ"ח כדי לקבל אישור להזמנה.'
  },
  {
    number: '03',
    icon: threeIcon,
    title: 'מתאמים ואוספים',
    text: 'יום לפני האירוע מתקשרים בין 9:00 ל-12:00 כדי לתאם שעת איסוף. האיסוף מתקיים לאחר 19:30. מגיעים בשעה שנקבעה עם צ׳ק פיקדון ומזומן לתשלום עבור הכלים.'
  },
  {
    number: '04',
    icon: fourIcon,
    title: 'מחזירים את הפריטים',
    text: 'את הכלים מחזירים למחרת האירוע, בתיאום מראש. יש לתאם בין 9:00 ל-12:00; ההחזרה לאחר 19:30. הכלים יוחזרו נקיים ויבשים, לאחר שטיפה במים ובסבון, בקופסה שבה נמסרו. את המפות מחזירים שלושה ימים לאחר האירוע, לאחר כביסה וייבוש וללא שימוש במייבש.'
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
          בוחרים את הפריטים, מתאמים את האיסוף ומחזירים בזמן — כך מתנהלת ההשאלה.
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
        <h2>חשוב לדעת</h2>
        <div>
          <Link to='/items/maps' className='how-it-works-primary'>לצפייה בקטלוג</Link>
          <Link to='/terms' className='how-it-works-secondary'>לקריאת התקנון</Link>
        </div>
      </section>
    </main>
  )
}

export default HowItWorks
