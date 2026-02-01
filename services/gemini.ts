import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to check if location is available
const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export const findCoursesNearby = async (query: string) => {
  try {
    let locationConfig = {};
    
    try {
      const loc = await getCurrentLocation();
      locationConfig = {
        retrievalConfig: {
          latLng: {
            latitude: loc.lat,
            longitude: loc.lng
          }
        }
      };
    } catch (e) {
      console.warn("Could not get location for grounding, proceeding without specific lat/lng", e);
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find golf courses: ${query}. return a list with their name, approximate distance if known, and a brief 1-sentence description.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: locationConfig
      },
    });

    // Extracting grounding chunks for better UI display if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Error finding courses:", error);
    throw error;
  }
};

export const generateMatchReport = async (
  tournamentName: string, 
  winnerName: string, 
  courseName: string,
  winningScore: number,
  format: string
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a short, enthusiastic, and slightly humorous 1-paragraph golf society press release for the tournament "${tournamentName}". 
      Winner: ${winnerName}. 
      Course: ${courseName}. 
      Score: ${winningScore} (${format}).
      Make it sound like a prestigious sports report but for a amateur group.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "Could not generate report at this time.";
  }
};