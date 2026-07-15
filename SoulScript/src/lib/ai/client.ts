import OpenAI from "openai";

export const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_AI_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});
