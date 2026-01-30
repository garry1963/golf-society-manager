
import { GoogleGenAI } from "@google/genai";

export const getGolfAdvice = async (query: string, context?: any) => {
  // Always use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are 'The Society Pro', an AI golf expert and administrator for a prestigious golf society. 
    You have deep knowledge of R&A and USGA rules, handicap systems (WHS), and golf psychology.
    Your tone is encouraging, professional, yet witty.
    
    When suggesting pairings: 
    - Mix high and low handicaps for balance OR group similar for competition.
    - Consider social dynamics.
    
    When giving tips:
    - Be specific (driving, putting, short game).
    - Use golf terminology correctly.
    
    If the user asks for help with the society software:
    - Explain features like Event Management, Member Tracking, and Scoring.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm currently stuck in the bunker. Please try again later!";
  }
};

export const generateEventReminder = async (eventTitle: string, course: string, date: string, participantsCount: number) => {
  // Always use process.env.API_KEY directly as per guidelines
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
