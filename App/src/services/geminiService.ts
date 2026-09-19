// App/src/services/geminiService.ts
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
export const GEMINI_MODEL = 'gemini-3.6-flash';

export interface GeminiVoiceResponse {
  replyText: string;
  action: 'SEARCH_PARKING' | 'BOOK_PARKING' | 'RECHARGE_FASTAG' | 'CHECK_CHALLAN' | 'FILL_DETAILS' | 'NAVIGATE' | 'NONE';
  params: {
    locationName?: string;
    durationHours?: number;
    vehiclePlate?: string;
    slotId?: string;
    amount?: number;
    route?: string;
  };
  followUpQuestion?: string;
}

export async function processVoiceCommandWithGemini(
  userQuery: string,
  contextData: {
    locations?: any[];
    userVehicles?: any[];
    walletBalance?: number;
    currentStep?: string;
    userName?: string;
  }
): Promise<GeminiVoiceResponse> {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key is not configured.');
    return {
      replyText: `Hi sir, I heard "${userQuery}". Let me search the best parking options for you right away!`,
      action: 'SEARCH_PARKING',
      params: { locationName: userQuery }
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const availableLocationsStr = contextData.locations
    ? contextData.locations.map((l) => `${l.parkingName} (${l.address}, ₹${l.hourlyPrice || 60}/hr, free slots: ${l.availableSlots ?? 'available'})`).join('; ')
    : 'CP Inner Circle, Noida Sector 18, Knowledge Park Sharda, Cyber Hub';

  const userVehiclesStr = contextData.userVehicles
    ? contextData.userVehicles.map((v) => `${v.model || 'Vehicle'} (${v.plate})`).join(', ')
    : 'Registered Vehicle';

  const systemPrompt = `
You are Drivix AI Voice Assistant — a human-like, polite, warm, and helpful voice copilot for smart parking, FASTag, vehicle services, and automated slot bookings.

User name: "${contextData.userName || 'Driver'}"
User registered vehicles: [${userVehiclesStr}]
User wallet balance: ₹${contextData.walletBalance ?? 0}
Available Parking Hubs in DB: [${availableLocationsStr}]
Current App Step: "${contextData.currentStep || 'MAP'}"

LANGUAGE & HUMAN PERSONALITY INSTRUCTIONS:
1. You understand ALL languages spoken across India fluently (English, Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Malayalam, Urdu, Odia, etc.).
2. Respond like a polite, warm human companion, addressing the user respectfully as "Hi sir," or equivalent respectful greeting when appropriate.
3. If the user speaks in Hindi/Hinglish (e.g., "Mujhe Sharda University ke paas parking chahiye"), reply in friendly, conversational Hindi/Hinglish (e.g., "Hi sir, main aapke liye Sharda University ke paas sabse accha parking slot dhoondh raha hoon!").
4. If the user speaks in any other Indian language, respond in that language or clean English/Hinglish with a warm human touch.

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN CODEBLOCKS):
{
  "replyText": "Human-like, polite conversational response to be spoken aloud via Voice AI",
  "action": "SEARCH_PARKING" | "BOOK_PARKING" | "RECHARGE_FASTAG" | "CHECK_CHALLAN" | "FILL_DETAILS" | "NAVIGATE" | "NONE",
  "params": {
    "locationName": "matched parking name or location query",
    "durationHours": 1,
    "vehiclePlate": "vehicle number if specified",
    "slotId": "slot number if specified",
    "amount": 500,
    "route": "/explore"
  },
  "followUpQuestion": "Optional follow-up question if information is missing"
}

Rulebook for Actions:
- Finding/Searching Parking (e.g., "Find parking near me", "Sharda ke paas jagah hai kya?"): action="SEARCH_PARKING", params.locationName="...".
- Booking/Reserving Slot (e.g., "Book slot for 2 hours", "Mera spot reserve kar do"): action="BOOK_PARKING", params.locationName="...", params.durationHours=...
- Recharge FASTag (e.g., "FASTag 500 recharge kar do", "Top up wallet"): action="RECHARGE_FASTAG", params.amount=500.
- Check Traffic Fines/Challans (e.g., "Mera challan check karo"): action="CHECK_CHALLAN".
- General Queries (e.g., "What are the rates?", "App kaise chalaye?"): action="NONE", answer accurately using DB data in replyText.
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
    const textPart = partsArr.find((p: any) => typeof p.text === 'string' && p.text.trim().length > 0);
    const rawText = textPart ? textPart.text : '';

    let parsed: GeminiVoiceResponse;
    try {
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanedText);
    } catch {
      parsed = {
        replyText: rawText || `Hi sir, how can I help you today?`,
        action: 'SEARCH_PARKING',
        params: { locationName: userQuery }
      };
    }
    return parsed;
  } catch (error) {
    console.warn('Gemini Voice Assistant Error:', error);
    return {
      replyText: `Hi sir, I heard "${userQuery}". Let me search the best parking options for you right away!`,
      action: 'SEARCH_PARKING',
      params: { locationName: userQuery }
    };
  }
}
