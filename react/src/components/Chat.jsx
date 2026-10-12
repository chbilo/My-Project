import React, { useState } from 'react'

import { API_BASE_URL } from '../api/axios'

import speechBubbleIcon from '../assets/icons/speech-bubble.gif'

const RobotIcon = () => (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
        <rect x='6' y='7' width='12' height='12' rx='3' />
        <path d='M12 4v3M10 4h4M4 10v5M20 10v5M9 15h6' />
        <circle cx='9.5' cy='11.5' r='.5' />
        <circle cx='14.5' cy='11.5' r='.5' />
    </svg>
)

const PersonIcon = () => (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
        <circle cx='12' cy='8' r='3.2' />
        <path d='M5 20c.6-3.3 2.9-5 7-5s6.4 1.7 7 5' />
    </svg>
)

const Chat = () => {
    const [message, setMessage] = useState('')

    const [chatHistory, setChatHistory] = useState([
        {
            role: 'model',
            text: 'שלום! אני כאן כדי לעזור לבחור כלים, סגנון שולחן ואווירה לאירוע.'
        }
    ])

    // ההיסטוריה שנשלחת למודל. היא נשמרת בזיכרון כל עוד הצ׳אט פתוח.
    const [conversationHistory, setConversationHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const sendMessage = async (generateImage = false) => {
        const messageText = message.trim()

        if (!messageText || loading) {
            return
        }

        const userMsg = { role: 'user', text: messageText }
        setChatHistory((prev) => [...prev, userMsg])
        setMessage('')
        setLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: messageText,
                    generateImage,
                    history: conversationHistory.slice(-10)
                })
            })

            const data = await response.json()

            if (response.ok) {
                const replyText = data.reply || 'לא התקבלה תשובה'

                // שומרים את חילופי הדברים המוצלחים האחרונים כדי לשלוח אותם בבקשה הבאה.
                setConversationHistory((prev) => [
                    ...prev,
                    { role: 'user', text: messageText },
                    { role: 'model', text: replyText }
                ].slice(-10))

                setChatHistory((prev) => [
                    ...prev,
                    {
                        role: 'model',
                        text: replyText,
                        image: data.image || null,
                        imageError: data.imageError || null
                    }
                ])
            } else {
                setChatHistory((prev) => [
                    ...prev,
                    {
                        role: 'error',
                        text: data.message || 'שגיאה בקבלת תשובה'
                    }
                ])
            }
        } catch {
            setChatHistory((prev) => [
                ...prev,
                {
                    role: 'error',
                    text: 'שגיאת תקשורת עם השרת'
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='chat-widget'>
            {isOpen && (
                <section className='chat-shell' aria-label='יועץ עיצוב שולחנות'>
                    <div className='chat-header'>
                        <div>
                            <h2>יועץ עיצוב שולחנות</h2>
                            <p>איך אפשר לעזור?</p>
                        </div>

                        <button
                            type='button'
                            className='chat-close-button'
                            onClick={() => setIsOpen(false)}
                            aria-label='סגירת הצ׳אט'
                        >
                            <svg viewBox='0 0 24 24' aria-hidden='true'>
                                <path d='m6 6 12 12M18 6 6 18' />
                            </svg>
                        </button>
                    </div>

                    <div className='chat-messages'>
                        {chatHistory.map((msg, index) => (
                            <div
                                key={index}
                                className={`chat-message ${msg.role}`}
                            >
                                <div className='chat-bubble'>
                                    {msg.role === 'error' ? (
                                        <>
                                            <strong>שגיאה:</strong>
                                            <span>{msg.text}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                className='chat-speaker-icon'
                                                role='img'
                                                aria-label={
                                                    msg.role === 'user'
                                                        ? 'הודעת משתמש'
                                                        : 'תשובת עוזר'
                                                }
                                            >
                                                {msg.role === 'user'
                                                    ? <PersonIcon />
                                                    : <RobotIcon />}
                                            </span>

                                            <div>
                                                <span>{msg.text}</span>

                                                {msg.image && (
                                                    <img
                                                        src={msg.image}
                                                        alt='הדמיה של עיצוב השולחן'
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            maxWidth: '280px',
                                                            height: 'auto',
                                                            marginTop: '12px',
                                                            borderRadius: '12px'
                                                        }}
                                                    />
                                                )}

                                                {msg.imageError && (
                                                    <p
                                                        style={{
                                                            margin: '10px 0 0',
                                                            color: '#8d2d2d',
                                                            fontSize: '13px'
                                                        }}
                                                    >
                                                        {msg.imageError}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className='chat-message model'>
                                <div className='chat-bubble is-loading'>
                                    <span
                                        className='chat-speaker-icon'
                                        role='img'
                                        aria-label='תשובת עוזר'
                                    >
                                        <RobotIcon />
                                    </span>
                                    <span>מעבד את הבקשה...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='chat-input-row'>
                        <input
                            type='text'
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    sendMessage(false)
                                }
                            }}
                            placeholder='תאר את האירוע או שאל על הכלים...'
                        />

                        <button
                            type='button'
                            onClick={() => sendMessage(false)}
                            disabled={loading || !message.trim()}
                        >
                            שלח
                        </button>
                    </div>

                    <div
                        style={{
                            padding: '0 12px 12px',
                            background: 'rgba(255, 255, 255, 0.9)'
                        }}
                    >
                        <button
                            type='button'
                            onClick={() => sendMessage(true)}
                            disabled={loading || !message.trim()}
                            style={{
                                width: '100%',
                                border: 'none',
                                borderRadius: '12px',
                                background: '#5b7774',
                                color: '#fff',
                                padding: '11px 14px',
                                fontWeight: 700,
                                cursor: loading || !message.trim()
                                    ? 'wait'
                                    : 'pointer',
                                opacity: loading || !message.trim() ? 0.7 : 1
                            }}
                        >
                            שלח והפק הדמיה
                        </button>
                    </div>
                </section>
            )}

            <button
                type='button'
                className='chat-launcher'
                onClick={() => setIsOpen((open) => !open)}
                aria-label={isOpen ? 'סגירת הצ׳אט' : 'פתיחת הצ׳אט'}
                aria-expanded={isOpen}
            >
                {isOpen ? (
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='m6 6 12 12M18 6 6 18' />
                    </svg>
                ) : (
                    <img
                        className='chat-launcher-icon'
                        src={speechBubbleIcon}
                        alt=''
                    />
                )}
            </button>
        </div>
    )
}

export default Chat