import { GoogleGenAI, Type } from "@google/genai";
import { City, DiagnosticCenter } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-pro';

const getPinCodesForCity = async (city: City): Promise<string[]> => {
  // FIX: Switched to responseSchema for robust JSON parsing and removed googleSearch tool as it's not compatible with responseSchema.
  // The model has sufficient knowledge for pin codes without real-time search.
  const prompt = `Find all postal pin codes for the city of ${city.city}, India. Be as comprehensive as possible.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pin_codes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of all postal pin codes for the specified city."
            }
          },
          required: ["pin_codes"]
        }
      },
    });

    // FIX: Removed markdown stripping as responseMimeType: "application/json" guarantees a raw JSON string.
    const jsonText = response.text.trim();
    
    if (!jsonText) return [];
    
    const parsed = JSON.parse(jsonText);
    
    if (parsed && Array.isArray(parsed.pin_codes)) {
        const pinCodes = parsed.pin_codes as (string|number)[];
        return [...new Set(pinCodes.map(String))];
    }

    console.error("Gemini returned unexpected format for pin codes:", parsed);
    return [];

  } catch (error) {
    console.error(`Error fetching pin codes for ${city.city}:`, error);
    throw new Error(`Failed to fetch pin codes for ${city.city}.`);
  }
};


const findDiagnosticCenters = async (city: City, pinCode: string): Promise<DiagnosticCenter[]> => {
    // FIX: Switched to responseSchema for robust JSON parsing.
    // Removed googleMaps tool as it's not compatible with responseSchema according to guidelines.
    // The prompt is updated to rely on the model's extensive knowledge base.
    const prompt = `Find all diagnostic centers, imaging centers, and hospitals with CT scan facilities in the area with pin code ${pinCode} in ${city.city}, India.

For each center, provide its name, full address, pin code, contact number, Google rating, a boolean indicating if a CT scan is available, a Google Maps link, its website, and its precise latitude and longitude.
- If a piece of information is not available, use "N/A" for strings and 0 for numbers (including latitude/longitude).
- Ensure 'ctAvailable' is always true. Discard any results where you cannot confirm a CT scan facility.
- Double-check that the pin code in the address matches ${pinCode}.
- If no centers are found, return an empty array.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: "You are an expert data researcher. Your goal is to be comprehensive and accurate. You must only return JSON that adheres to the provided schema.",
                temperature: 0,
                seed: 2024,
                thinkingConfig: { thinkingBudget: 32768 },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Name of the center." },
                            address: { type: Type.STRING, description: "Full address of the center." },
                            pinCode: { type: Type.STRING, description: "Postal pin code." },
                            contactNumber: { type: Type.STRING, description: "Contact phone number. 'N/A' if not available." },
                            googleRating: { type: Type.NUMBER, description: "Google Maps rating (0 if not available)." },
                            ctAvailable: { type: Type.BOOLEAN, description: "True if a CT scan facility is confirmed to be available." },
                            mapLink: { type: Type.STRING, description: "URL to Google Maps. 'N/A' if not available." },
                            website: { type: Type.STRING, description: "Official website URL. 'N/A' if not available." },
                            latitude: { type: Type.NUMBER, description: "GPS latitude coordinate (0 if not available)." },
                            longitude: { type: Type.NUMBER, description: "GPS longitude coordinate (0 if not available)." },
                        },
                        required: ["name", "address", "pinCode", "contactNumber", "googleRating", "ctAvailable", "mapLink", "website", "latitude", "longitude"]
                    }
                }
            },
        });

        // FIX: Removed markdown stripping as responseMimeType: "application/json" guarantees a raw JSON string.
        const jsonText = response.text.trim();

        if (!jsonText || jsonText === '[]') {
            return [];
        }

        const centers = JSON.parse(jsonText);

        if (Array.isArray(centers)) {
            // The schema should enforce the types, but we filter for ctAvailable as an extra safety measure based on original code.
            return (centers as DiagnosticCenter[]).filter(c => c.ctAvailable);
        }

        console.error("Gemini returned unexpected format for diagnostic centers:", centers);
        return [];

    } catch (error) {
        console.error(`Error finding diagnostic centers for pin code ${pinCode} in ${city.city}:`, error);
        return [];
    }
};

export const geminiService = {
  getPinCodesForCity,
  findDiagnosticCenters,
};
