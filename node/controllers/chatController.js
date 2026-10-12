const { ai, hasValidGeminiKey } = require('../config/google')
const Item = require('../models/Item')
const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')

const uploadsDirectory = path.resolve(__dirname, '../uploads')

const imageGenerationModel = 'gemini-nano-banana-2.1'
const maxImageReferences = 10

const imageMimeTypes = {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
}

const maxSourceImageSize = 20 * 1024 * 1024
const maxTotalImageSize = 14 * 1024 * 1024

const readProductImage = async (imagePath) => {
    if (typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) {
        return null
    }

    const filename = imagePath.slice('/uploads/'.length)

    if (!filename || filename !== path.basename(filename)) {
        return null
    }

    const mimeType = imageMimeTypes[path.extname(filename).toLowerCase()]

    if (!mimeType) {
        return null
    }

    const filePath = path.join(uploadsDirectory, filename)

    try {
        const fileStats = await fs.stat(filePath)

        if (!fileStats.isFile() || fileStats.size > maxSourceImageSize) {
            return null
        }

        const image = await fs.readFile(filePath)

        const optimizedImage = await sharp(image, {
            limitInputPixels: 40_000_000
        })
            .rotate()
            .resize({
                width: 512,
                height: 512,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 68 })
            .toBuffer()

        return {
            data: optimizedImage.toString('base64'),
            mimeType: 'image/webp',
            size: optimizedImage.length
        }
    } catch {
        return null
    }
}

const handleChat = async (req, res) => {
    try {
        const message =
            typeof req.body?.message === 'string'
                ? req.body.message.trim()
                : ''

        const generateImage = req.body?.generateImage === true

        const incomingHistory = Array.isArray(req.body?.history)
            ? req.body.history
            : []

        // מקבלים רק הודעות טקסט קודמות בתפקידים המותרים, ועד עשר הודעות.
        const historyContents = incomingHistory
            .slice(-10)
            .filter((entry) =>
                (entry?.role === 'user' || entry?.role === 'model') &&
                typeof entry?.text === 'string' &&
                entry.text.trim()
            )
            .map((entry) => ({
                role: entry.role,
                parts: [{ text: entry.text.trim().slice(0, 2000) }]
            }))

        // צירוף בקשות המשתמש האחרונות עוזר בחיפוש גם בהודעות המשך,
        // למשל "תעשה את זה בכחול".
        const previousUserMessages = historyContents
            .filter((entry) => entry.role === 'user')
            .slice(-2)
            .map((entry) => entry.parts[0].text)

        const searchQuery = [...previousUserMessages, message].join('\n')

        if (!message) {
            return res.status(400).json({ message: 'נא להזין הודעה' })
        }

        if (!hasValidGeminiKey) {
            return res.status(503).json({
                message: 'שירות הצ׳אט אינו מוגדר כרגע. יש לבדוק את מפתח Gemini.'
            })
        }

        const items = await Item.aggregate([
            {
                $vectorSearch: {
                    index: 'autoembed_index',
                    path: 'embeddingText',
                    query: { text: searchQuery },
                    numCandidates: 100,
                    limit: 10,
                    filter: {
                        isAvailable: true,
                        quantity: { $gt: 0 }
                    }
                }
            },
            {
                $project: {
                    code: 1,
                    title: 1,
                    category: 1,
                    subcategory: 1,
                    colors: 1,
                    size: 1,
                    material: 1,
                    quantity: 1,
                    description: 1,
                    images: 1
                }
            }
        ])

        const itemsList = items.map((item) => {
            const itemName = item.title || item.code || 'פריט'

            const itemColors = item.colors?.length
                ? item.colors.join(', ')
                : 'לא צוין'

            const itemDetails = [
                `קטגוריה: ${item.category || 'לא צוינה'}`,
                item.subcategory && `תת-קטגוריה: ${item.subcategory}`,
                `צבעים: ${itemColors}`,
                item.size && `גודל: ${item.size}`,
                item.material && `חומר: ${item.material}`,
                `כמות זמינה: ${item.quantity}`,
                item.description && `תיאור: ${item.description}`
            ]
                .filter(Boolean)
                .join(' | ')

            return `- ${itemName} | ${itemDetails}`
        }).join('\n') || 'לא נמצאו פריטים זמינים שמתאימים לחיפוש.'

        const systemInstruction = `
אתה יועץ לעיצוב אירועים, עמדות בר ושולחנות.
המלץ על פריטים ושילובים רק מתוך רשימת המלאי שנשלחה אליך.

רשימת הפריטים המתאימים שנמצאו:
${itemsList}

כללים:
1. אל תמציא פריטים או פרטי מלאי שאינם מופיעים ברשימה.
2. אם לא נמצאו פריטים מתאימים, אמור זאת בבירור.
3. ענה בעברית, בנימוס ובקצרה.
4. השתמש בהיסטוריית השיחה כדי להבין למה המשתמש מתייחס, אך הסתמך על רשימת המוצרים העדכנית בלבד לגבי פריטים וזמינות.
`

        const contentParts = [
            { text: `הודעת המשתמש: ${message}` }
        ]

        const imageReferenceParts = []
        let totalImageSize = 0

        for (const item of items) {
            const imageCount = imageReferenceParts.filter(
                (part) => part.type === 'image'
            ).length

            if (imageCount >= maxImageReferences) {
                break
            }

            const imagePath = item.images?.[0]

            if (!imagePath) {
                continue
            }

            const productImage = await readProductImage(imagePath)

            if (
                !productImage ||
                totalImageSize + productImage.size > maxTotalImageSize
            ) {
                continue
            }

            const itemName = item.title || item.code || 'פריט'
            const itemLabel =
                `תמונת מוצר מהמלאי: ${itemName} | קטגוריה: ${item.category || 'לא צוינה'}`

            contentParts.push(
                { text: itemLabel },
                {
                    inlineData: {
                        mimeType: productImage.mimeType,
                        data: productImage.data
                    }
                }
            )

            imageReferenceParts.push(
                { type: 'text', text: itemLabel },
                {
                    type: 'image',
                    mime_type: productImage.mimeType,
                    data: productImage.data
                }
            )

            totalImageSize += productImage.size
        }

        const textResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
                ...historyContents,
                {
                    role: 'user',
                    parts: contentParts
                }
            ],
            config: { systemInstruction }
        })

        const reply = textResponse.text?.trim()

        if (!reply) {
            return res.status(502).json({
                message: 'לא התקבלה תשובה מהצ׳אט'
            })
        }

        if (!generateImage) {
            return res.json({ reply })
        }

        if (items.length === 0) {
            return res.json({
                reply,
                imageError: 'לא נמצאו כלים מתאימים במלאי, ולכן לא יצרתי הדמיה.'
            })
        }

        if (imageReferenceParts.length === 0) {
            return res.json({
                reply,
                imageError: 'לא נמצאו תמונות של הכלים המתאימים, ולכן לא ניתן ליצור הדמיה.'
            })
        }

        try {
            const imagePrompt = `
צור הדמיה ריאליסטית לפי סוג העיצוב שביקש המשתמש.

בקשת המשתמש:
${message}

תוכנית העיצוב:
${reply}

תמונות המוצרים המצורפות הן פריטים אמיתיים מהמלאי. השתמש בתמונות הרלוונטיות לבקשה, ושמור על הצורה, הצבע והחומר של הכלים.
- בבקשה לעיצוב בר או עמדת בר: הצג דלפק בר, והשתמש בפריטים מקטגוריית "כלים לבר" באזור הבר. אל תהפוך את הסצנה לשולחן אוכל.
- בבקשה לעיצוב שולחן: הצג שולחן לפי הבקשה. השתמש במפות מקטגוריית "מפות" ובמרכזי שולחן מקטגוריית "מרכזי שולחן". הוסף כיסאות ומקומות ישיבה רק אם הם מתאימים לבקשה.
- אם מבוקשים גם בר וגם שולחנות: הצג את אזור הבר ואת שולחנות האורחים כאזורים נפרדים. השתמש בכלים לבר באזור הבר ובמרכזי שולחן על שולחנות האורחים.
- מותר לשנות או להוסיף את התוכן שבתוך כלי ההגשה לפי האירוע, למשל פירות, קינוחים, שתייה או פרחים. שמור על מראה הכלי עצמו.
- אל תוסיף כיתוב או לוגו. התמונה היא הדמיה להמחשה.
`

            const imageInteraction = await ai.interactions.create({
                model: imageGenerationModel,
                input: [
                    { type: 'text', text: imagePrompt },
                    ...imageReferenceParts
                ],
                response_format: {
                    type: 'image',
                    mime_type: 'image/jpeg',
                    aspect_ratio: '4:3',
                    image_size: '1K'
                }
            })

            const generatedImage = imageInteraction.output_image

            if (!generatedImage?.data) {
                return res.json({
                    reply,
                    imageError: 'לא התקבלה תמונה ממודל יצירת התמונות.'
                })
            }

            const imageMimeType =
                generatedImage.mime_type ||
                generatedImage.mimeType ||
                'image/png'

            const image =
                `data:${imageMimeType};base64,${generatedImage.data}`

            return res.json({ reply, image })
        } catch (imageError) {
            const status =
                Number.isInteger(imageError.status)
                    ? imageError.status
                    : undefined

            console.error('[chat] Image generation failed:', {
                status,
                message: imageError.message || 'Unknown image generation error'
            })

            return res.json({
                reply,
                imageError:
                    'התשובה התקבלה, אבל יצירת התמונה נכשלה. נבדוק את הגדרת Gemini API בשלב הבדיקה.'
            })
        }
    } catch (error) {
        const status =
            Number.isInteger(error.status) &&
                error.status >= 400 &&
                error.status < 600
                ? error.status
                : 500

        console.error('[chat] Request failed:', {
            status,
            message: error.message || 'Unknown error'
        })

        return res.status(status).json({
            message: 'שגיאה בשרת בעת עיבוד ההודעה'
        })
    }
}

module.exports = { handleChat }