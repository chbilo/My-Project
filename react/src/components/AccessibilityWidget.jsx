import { useEffect, useRef, useState } from 'react'

const settingClasses = {
    highContrast: 'accessibility-high-contrast',
    underlineLinks: 'accessibility-underline-links',
    grayscale: 'accessibility-grayscale',
    reduceMotion: 'accessibility-reduce-motion'
}

const initialSettings = {
    highContrast: false,
    underlineLinks: false,
    grayscale: false,
    reduceMotion: false
}

const AccessibilityWidget = ({ isOpen, onToggle, onClose }) => {
    const launcherRef = useRef(null)
    const firstSettingRef = useRef(null)
    const [settings, setSettings] = useState(initialSettings)
    const [textZoom, setTextZoom] = useState(1)

    useEffect(() => {
        const root = document.documentElement

        Object.entries(settingClasses).forEach(([setting, className]) => {
            root.classList.toggle(className, settings[setting])
        })

        return () => {
            Object.values(settingClasses).forEach((className) => {
                root.classList.remove(className)
            })
        }
    }, [settings])

    useEffect(() => {
        const root = document.documentElement

        if (textZoom === 1) {
            root.style.removeProperty('zoom')
        } else {
            root.style.zoom = String(textZoom)
        }

        return () => root.style.removeProperty('zoom')
    }, [textZoom])

    useEffect(() => {
        if (isOpen) {
            firstSettingRef.current?.focus()
        }
    }, [isOpen])

    const toggleSetting = (setting) => {
        setSettings((current) => ({
            ...current,
            [setting]: !current[setting]
        }))
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && isOpen) {
            onClose()
            launcherRef.current?.focus()
        }
    }

    return (
        <div
            className='accessibility-widget'
            onKeyDown={handleKeyDown}
        >
            <button
                ref={launcherRef}
                type='button'
                className='accessibility-launcher'
                onClick={onToggle}
                aria-label={isOpen ? 'סגירת תפריט נגישות' : 'פתיחת תפריט נגישות'}
                aria-expanded={isOpen}
                aria-controls='accessibility-panel'
            >
                <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <circle cx='14.5' cy='4.5' r='2' />
                    <circle cx='8' cy='17' r='4' />
                    <path d='M12.5 8H9.8a3.1 3.1 0 0 0 0 6.2h4.1l2.2 4.1h3.1M13 8l1.2 4.3h3.2' />
                </svg>
            </button>

            <section
                id='accessibility-panel'
                className='accessibility-panel'
                aria-label='הגדרות נגישות'
                hidden={!isOpen}
            >
                <h2>הגדרות נגישות</h2>
                <div className='accessibility-zoom-controls' role='group' aria-label='שינוי גודל התצוגה'>
                    <button
                        ref={firstSettingRef}
                        type='button'
                        onClick={() => setTextZoom((current) =>
                            Math.min(2, Number((current + 0.1).toFixed(1)))
                        )}
                        disabled={textZoom >= 2}
                    >
                        הגדלת תצוגה
                    </button>
                    <button
                        type='button'
                        onClick={() => setTextZoom((current) =>
                            Math.max(1, Number((current - 0.1).toFixed(1)))
                        )}
                        disabled={textZoom <= 1}
                    >
                        הקטנת תצוגה
                    </button>
                </div>
                <span className='accessibility-zoom-status' aria-live='polite' aria-atomic='true'>
                    {textZoom === 1
                        ? 'גודל התצוגה הרגיל'
                        : `גודל התצוגה ${Math.round(textZoom * 100)} אחוז`}
                </span>
                <button
                    type='button'
                    aria-pressed={settings.highContrast}
                    onClick={() => toggleSetting('highContrast')}
                >
                    ניגודיות גבוהה
                </button>
                <button
                    type='button'
                    aria-pressed={settings.underlineLinks}
                    onClick={() => toggleSetting('underlineLinks')}
                >
                    הדגשת קישורים
                </button>
                <button
                    type='button'
                    aria-pressed={settings.grayscale}
                    onClick={() => toggleSetting('grayscale')}
                >
                    גווני אפור
                </button>
                <button
                    type='button'
                    aria-pressed={settings.reduceMotion}
                    onClick={() => toggleSetting('reduceMotion')}
                >
                    הפחתת תנועה
                </button>
                <button
                    type='button'
                    className='accessibility-reset'
                    onClick={() => {
                        setSettings(initialSettings)
                        setTextZoom(1)
                    }}
                >
                    איפוס הגדרות
                </button>
            </section>
        </div>
    )
}

export default AccessibilityWidget
