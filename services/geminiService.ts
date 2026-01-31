
import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

export const getGolfAdvice = async (query: string, useSearch: boolean = false) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are 'The Society Pro', an AI golf expert and administrator for a prestigious golf society. 
    You have deep knowledge of R&A and USGA rules, handicap systems (WHS), and golf psychology.
    Your tone is encouraging, professional, yet witty.
    
    If Google Search is enabled, use it to find the latest news, tournament results, or equipment reviews.
    Always prioritize accuracy and recent developments in the golf world.
  `;

  try {
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config,
    });

    const text = response.text || "I'm sorry, I couldn't process that.";
    const sources: GroundingSource[] = [];

    // Extract grounding chunks as per guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "Web Source",
          uri: chunk.web.uri,
        });
      }
    });

    return { text, sources };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Sorry, I'm currently stuck in the bunker. Please try again later!", sources: [] };
  }
};

export const generateEventReminder = async (eventTitle: string, course: string, date: string, participantsCount: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Write a witty and professional email/in-app reminder for a golf society outing. 
    Event: ${eventTitle}
    Course: ${course}
    Date: ${date}
    Total Registered: ${participantsCount}
    
    Include a tip about checking their handicaps or arriving 30 minutes early. 
    Keep it concise (max 100 words).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are the witty administrator of a high-end golf society. Your goal is to get players excited for an upcoming tournament.",
        temperature: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Reminder Generation Error:", error);
    return `Hi everyone! Just a reminder for our upcoming tournament: ${eventTitle} at ${course} on ${date}. Looking forward to seeing you all there!`;
  }
};
