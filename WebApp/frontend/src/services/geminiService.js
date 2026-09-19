// WebApp/frontend/src/services/geminiService.js
export const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
export const GEMINI_MODEL = 'gemini-3.6-flash';

export async function processVoiceCommandWithGemini(userQuery, contextData = {}) {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key is not configured.');
    return {
      replyText: `Hi sir, I heard "${userQuery}". Let me help you find the best parking spot right away!`,
      action: 'SEARCH_PARKING',
      params: { locationName: userQuery }
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const systemPrompt = `
You are Drivix AI Voice Assistant — a human-like, polite, warm, and helpful voice copilot for smart parking, FASTag, vehicle services, and automated slot bookings.

User name: "${contextData.userName || 'Driver'}"
User wallet balance: ₹${contextData.walletBalance ?? 0}

LANGUAGE & HUMAN PERSONALITY INSTRUCTIONS:
1. You understand ALL languages spoken across India fluently (English, Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Malayalam, Urdu, Odia, etc.).
2. Respond like a polite, warm human companion, addressing the user respectfully as "Hi sir," or equivalent respectful greeting when appropriate.
3. If the user speaks in Hindi/Hinglish, respond in natural, friendly Hindi/Hinglish starting with "Hi sir".

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN CODEBLOCKS):
{
  "replyText": "Human-like, polite conversational response to be spoken aloud via Voice AI",
  "action": "SEARCH_PARKING" | "BOOK_PARKING" | "RECHARGE_FASTAG" | "CHECK_CHALLAN" | "FILL_DETAILS" | "NAVIGATE" | "NONE",
  "params": {
    "locationName": "matched parking name or search text",
    "durationHours": 1,
    "vehiclePlate": "vehicle number if specified",
    "amount": 500,
    "route": "/services"
  },
  "followUpQuestion": "Optional follow-up question if required"
}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User Said: "${userQuery}"` }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const partsArr = data?.candidates?.[0]?.content?.parts || [];
    const textPart = partsArr.find((p) => typeof p.text === 'string' && p.text.trim().length > 0);
    const rawText = textPart ? textPart.text : '';

    try {
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch {
      return {
        replyText: rawText || `Hi sir, how can I help you today?`,
        action: 'SEARCH_PARKING',
        params: { locationName: userQuery }
      };
    }
  } catch (error) {
    console.warn('Gemini Web Assistant Error:', error);
    return {
      replyText: `Hi sir, I heard "${userQuery}". Let me help you find the best parking spot right away!`,
      action: 'SEARCH_PARKING',
      params: { locationName: userQuery }
    };
  }
}
