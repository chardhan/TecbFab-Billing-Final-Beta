
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestItemDescription = async (shortDesc: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Enhance this billing item description for a professional Malaysian invoice. Keep it concise but professional. Input: "${shortDesc}"`,
    });
    return response.text?.trim() || shortDesc;
  } catch (err) {
    console.error("Gemini Error:", err);
    return shortDesc;
  }
};

export const classifySST = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Classify if the following item description is likely taxable under Malaysian SST (Sales and Service Tax) or exempt. Provide a JSON object with 'taxable' (boolean) and 'reason' (string). Item: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            taxable: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["taxable", "reason"]
        }
      }
    });
    return JSON.parse(response.text || '{"taxable": true, "reason": "Default"}');
  } catch (err) {
    return { taxable: true, reason: "Error determining tax" };
  }
};
