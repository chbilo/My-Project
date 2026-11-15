import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import api, { getUploadUrl } from '../../api/axios'

const isVideo = (inspiration) => inspiration.mediaType === 'video'

const Gallery = () => {
  const [inspirations, setInspirations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(null)
  const lightboxRef = useRef(null)
  const lightboxCloseRef = useRef(null)
  const lightboxOpenerRef = useRef(null)
  const isLightboxOpen = activeImageIndex !== null

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
    if (!isLightboxOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setActiveImageIndex(null)
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setActiveImageIndex((current) => (current - 1 + inspirations.length) % inspirations.length)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setActiveImageIndex((current) => (current + 1) % inspirations.length)
      }

      if (event.key === 'Tab') {
        const focusableElements = Array.from(
          lightboxRef.current?.querySelectorAll(
            'button:not([disabled]), video[controls], a[href], [tabindex]:not([tabindex="-1"])'
          ) || []
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (!firstElement) {
          event.preventDefault()
        } else if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.body.classList.add('gallery-lightbox-open')
    lightboxCloseRef.current?.focus()
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('gallery-lightbox-open')
      document.removeEventListener('keydown', handleKeyDown)
      lightboxOpenerRef.current?.focus()
    }
  }, [isLightboxOpen, inspirations.length])

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
    <main id='main-content' tabIndex={-1} className='gallery-page'>
      <header className='gallery-heading'>
        <p className='eyebrow'>רעיונות לעיצוב</p>
        <h1>גלריית השראה</h1>
        <p>רגעים, צבעים ושולחנות שיעזרו לכם לדמיין את האירוע הבא שלכם.</p>
      </header>

      {loading && (
        <section className='gallery-grid gallery-skeleton-grid' aria-label='טוען תמונות'>
          {Array.from({ length: 6 }, (_, index) => <div key={index} className='gallery-skeleton-card' />)}
        </section>
      )}
      {error && <p className='error-message' role='alert'>{error}</p>}
      <section className='admin-create gallery-submit'>
        <div className='gallery-submit-heading'>
          <div>
            <h2>שתפו תמונות מהאירוע שלכם</h2>
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
          <label>כותרת <span className='field-optional'>(לא חובה)</span><input name='title' type='text' /></label>
          <label>תיאור <span className='field-optional'>(לא חובה)</span><textarea name='description' rows='2' /></label>
          <label>קטגוריה <span className='field-optional'>(לא חובה)</span><input name='category' type='text' /></label>
          <label>תמונה או וידאו<input name='image' type='file' accept='image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime' required /></label>
          <button type='submit' disabled={submitting}>{submitting ? 'שולח...' : 'שליחת תמונה לאישור'}</button>
          {success && <p className='success-message' role='status'>{success}</p>}
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
              onClick={(event) => {
                lightboxOpenerRef.current = event.currentTarget
                setActiveImageIndex(index)
              }}
              aria-label={`פתיחת ${inspiration.title || 'תמונת השראה'} במסך מלא`}
            >
              {isVideo(inspiration) ? (
                <video src={getUploadUrl(inspiration.image)} muted playsInline preload='metadata' />
              ) : (
                <img src={getUploadUrl(inspiration.image)} alt={inspiration.title || 'תמונת השראה'} />
              )}
              {isVideo(inspiration) && <span className='gallery-video-badge'>וידאו</span>}
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
        createPortal(<div
          ref={lightboxRef}
          className='gallery-lightbox'
          role='dialog'
          aria-modal='true'
          aria-label='תצוגת תמונה במסך מלא'
          tabIndex={-1}
        >
          <button
            ref={lightboxCloseRef}
            type='button'
            className='gallery-lightbox-close'
            onClick={() => setActiveImageIndex(null)}
            aria-label='סגירת התמונה'
          >
            <svg viewBox='0 0 24 24' aria-hidden='true'><path d='m7 7 10 10M17 7 7 17' /></svg>
          </button>
          <figure className='gallery-lightbox-content' onClick={(event) => event.stopPropagation()}>
            <div className='gallery-lightbox-image'>
              {isVideo(inspirations[activeImageIndex]) ? (
                <video src={getUploadUrl(inspirations[activeImageIndex].image)} controls autoPlay playsInline />
              ) : (
                <img src={getUploadUrl(inspirations[activeImageIndex].image)} alt={inspirations[activeImageIndex].title || 'תמונת השראה'} />
              )}
              <button
                type='button'
                className='gallery-lightbox-arrow gallery-lightbox-prev'
                onClick={(event) => { event.stopPropagation(); setActiveImageIndex((current) => (current - 1 + inspirations.length) % inspirations.length) }}
                aria-label='תמונה קודמת'
              >
                <svg viewBox='0 0 24 24' aria-hidden='true'><path d='m15 5-7 7 7 7' /></svg>
              </button>
              <button
                type='button'
                className='gallery-lightbox-arrow gallery-lightbox-next'
                onClick={(event) => { event.stopPropagation(); setActiveImageIndex((current) => (current + 1) % inspirations.length) }}
                aria-label='תמונה הבאה'
              >
                <svg viewBox='0 0 24 24' aria-hidden='true'><path d='m9 5 7 7-7 7' /></svg>
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
