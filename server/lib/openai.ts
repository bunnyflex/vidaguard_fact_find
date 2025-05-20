import OpenAI from "openai";

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "" 
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Interface for generating AI responses
export interface AIResponse {
  content: string;
  role: string;
}

export interface AIAssistantConfig {
  model: string;
  systemPrompt: string;
  temperature: number;
}

// Generate AI response based on conversation history and configuration
export async function generateAIResponse(
  messages: Array<{ role: string; content: string }>,
  config: AIAssistantConfig
): Promise<AIResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: config.systemPrompt
        },
        ...messages
      ],
      temperature: config.temperature,
    });

    return {
      content: response.choices[0].message.content || "I'm sorry, I don't have a response for that.",
      role: "assistant"
    };
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response: " + (error as Error).message);
  }
}

// Function to analyze responses for informing conditional logic
export async function analyzeResponse(
  question: string,
  answer: string,
  systemPrompt: string
): Promise<{
  interpretation: string;
  nextAction?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt + "\nAnalyze the user's response to determine the next appropriate action."
        },
        {
          role: "user",
          content: `Question: ${question}\nUser's answer: ${answer}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      interpretation: result.interpretation || "No interpretation available",
      nextAction: result.nextAction
    };
  } catch (error) {
    console.error("Error analyzing response:", error);
    throw new Error("Failed to analyze response: " + (error as Error).message);
  }
}

export default {
  generateAIResponse,
  analyzeResponse
};
