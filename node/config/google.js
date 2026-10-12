const { GoogleGenAI } = require('@google/genai')

const rawKey = process.env.GEMINI_API_KEY || ''
const hasValidGeminiKey = Boolean(rawKey) && !rawKey.includes('your_gemini_api_key_here')

if (!hasValidGeminiKey) {
    console.warn('[chat] GEMINI_API_KEY is missing or still using the placeholder value. Add a real Google AI Studio key to node/.env')
}

const ai = new GoogleGenAI({
    apiKey: rawKey
})

module.exports = { ai, hasValidGeminiKey }