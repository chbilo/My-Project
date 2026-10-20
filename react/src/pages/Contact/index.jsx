const Contact = () => {
    return (
        <main className='contact-page'>
            <section className='contact-intro'>
                <p className='eyebrow'>אנחנו כאן בשבילכם</p>
                <h1>בואו נדבר<br />על האירוע שלכם.</h1>
                <p>שאלה על מוצר, תאריך או הזמנה? נשמח לעזור לכם למצוא את הפתרון המתאים.</p>
            </section>

            <section className='contact-details'>
                <div className='contact-detail'>
                    <span className='contact-detail-label'>טלפון</span>
                    <a href='tel:0527140236'>052-7140236</a>
                    <small>זמינים לשיחה ועזרה בבחירה</small>
                </div>
                <div className='contact-detail'>
                    <span className='contact-detail-label'>אימייל</span>
                    <a href='mailto:bialistok@gmail.com'>bialistok@gmail.com</a>
                    <small>נחזור אליכם בהקדם</small>
                </div>
            </section>
        </main>
    )
}

export default Contact
