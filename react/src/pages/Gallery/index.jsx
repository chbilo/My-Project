import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api, { getUploadUrl } from '../../api/axios'

const Gallery = () => {
  const [inspirations, setInspirations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(null)

  useEffect(() => {
    const loadInspirations = async () => {
      try {
        const response = await api.get('inspirations')
        setInspirations(response.data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'לא ניתן לטעון את גלריית ההשראה')
      } finally {
        setLoading(false)
      }
    }

    loadInspirations()
  }, [])

  useEffect(() => {
    if (activeImageIndex === null) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') setActiveImageIndex((current) => (current - 1 + inspirations.length) % inspirations.length)
      if (event.key === 'ArrowRight') setActiveImageIndex((current) => (current + 1) % inspirations.length)
    }

    document.body.classList.add('gallery-lightbox-open')
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('gallery-lightbox-open')
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImageIndex, inspirations.length])

  const submitInspiration = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await api.post('inspirations', new FormData(event.target), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      event.target.reset()
      setSuccess('התמונה נשלחה ותוצג לאחר אישור מנהל.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'שליחת תמונת ההשראה נכשלה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className='gallery-page'>
      <header className='gallery-heading'>
        <p className='eyebrow'>רעיונות לאירוח</p>
        <h1>גלריית השראה</h1>
        <p>רגעים, צבעים ושולחנות שיעזרו לכם לדמיין את האירוע הבא שלכם.</p>
      </header>

      {loading && (
        <section className='gallery-grid gallery-skeleton-grid' aria-label='טוען תמונות'>
          {Array.from({ length: 6 }, (_, index) => <div key={index} className='gallery-skeleton-card' />)}
        </section>
      )}
      {error && <p className='error-message'>{error}</p>}
      <section className='admin-create gallery-submit'>
        <div className='gallery-submit-heading'>
          <div>
            <h2>שתפו תמונת השראה</h2>
            <p>התמונה תיבדק על ידי מנהל לפני שתופיע בגלריה.</p>
          </div>
          <button
            type='button'
            className='gallery-submit-toggle'
            aria-expanded={showSubmissionForm}
            onClick={() => setShowSubmissionForm((isOpen) => !isOpen)}
          >
            {showSubmissionForm ? 'סגירת טופס' : 'הוספת תמונה'}
          </button>
        </div>
        {showSubmissionForm && <form onSubmit={submitInspiration} className='admin-form'>
          <label>כותרת<input name='title' type='text' /></label>
          <label>תיאור<textarea name='description' rows='2' /></label>
          <label>קטגוריה<input name='category' type='text' /></label>
          <label>תמונה<input name='image' type='file' accept='image/jpeg,image/png,image/gif,image/webp' required /></label>
          <button type='submit' disabled={submitting}>{submitting ? 'שולח...' : 'שליחת תמונה לאישור'}</button>
          {success && <p className='success-message'>{success}</p>}
        </form>}
      </section>
      {!loading && !error && inspirations.length === 0 && (
        <p className='empty-state'>גלריית ההשראה תתמלא בקרוב.</p>
      )}

      {!loading && <section className='gallery-grid'>
        {inspirations.map((inspiration, index) => (
          <figure key={inspiration._id} className='gallery-card'>
            <button
              type='button'
              className='gallery-image-button'
              onClick={() => setActiveImageIndex(index)}
              aria-label={`פתיחת ${inspiration.title || 'תמונת השראה'} במסך מלא`}
            >
              <img src={getUploadUrl(inspiration.image)} alt={inspiration.title || 'תמונת השראה'} />
            </button>
            {(inspiration.title || inspiration.description || inspiration.category) && (
              <figcaption>
                {inspiration.category && <span>{inspiration.category}</span>}
                {inspiration.title && <strong>{inspiration.title}</strong>}
                {inspiration.description && <p>{inspiration.description}</p>}
              </figcaption>
            )}
          </figure>
        ))}
      </section>}

      {activeImageIndex !== null && inspirations[activeImageIndex] && (
        createPortal(<div className='gallery-lightbox' role='dialog' aria-modal='true' aria-label='תצוגת תמונה במסך מלא'>
          <button type='button' className='gallery-lightbox-close' onClick={() => setActiveImageIndex(null)} aria-label='סגירת התמונה'>
            <svg viewBox='0 0 24 24' aria-hidden='true'><path d='m7 7 10 10M17 7 7 17' /></svg>
          </button>
          <figure className='gallery-lightbox-content' onClick={(event) => event.stopPropagation()}>
            <div className='gallery-lightbox-image'>
              <img src={getUploadUrl(inspirations[activeImageIndex].image)} alt={inspirations[activeImageIndex].title || 'תמונת השראה'} />
              <button
                type='button'
                className='gallery-lightbox-arrow gallery-lightbox-prev'
                onClick={(event) => { event.stopPropagation(); setActiveImageIndex((current) => (current - 1 + inspirations.length) % inspirations.length) }}
                aria-label='תמונה קודמת'
              >
                <svg viewBox='0 0 24 24' aria-hidden='true'><path d='m9 5 7 7-7 7' /></svg>
              </button>
              <button
                type='button'
                className='gallery-lightbox-arrow gallery-lightbox-next'
                onClick={(event) => { event.stopPropagation(); setActiveImageIndex((current) => (current + 1) % inspirations.length) }}
                aria-label='תמונה הבאה'
              >
                <svg viewBox='0 0 24 24' aria-hidden='true'><path d='m15 5-7 7 7 7' /></svg>
              </button>
            </div>
            {(inspirations[activeImageIndex].title || inspirations[activeImageIndex].description) && (
              <figcaption>
                {inspirations[activeImageIndex].title && <strong>{inspirations[activeImageIndex].title}</strong>}
                {inspirations[activeImageIndex].description && <p>{inspirations[activeImageIndex].description}</p>}
              </figcaption>
            )}
          </figure>
        </div>, document.body)
      )}
    </main>
  )
}

export default Gallery
