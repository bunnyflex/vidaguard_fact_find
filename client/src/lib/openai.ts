// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

import { apiRequest } from "./queryClient";

interface Message {
  role: string;
  content: string;
}

interface AIResponse {
  content: string;
  role: string;
}

/**
 * Generate an AI response through the backend OpenAI integration
 */
export async function generateAIResponse(messages: Message[]): Promise<AIResponse> {
  try {
    const response = await apiRequest("POST", "/api/ai/generate", { messages });
    return response.json();
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error(`Failed to generate AI response: ${(error as Error).message}`);
  }
}

/**
 * Analyze user response to determine next steps based on conditional logic
 */
export async function analyzeUserResponse(
  question: string,
  answer: string
): Promise<{ interpretation: string; nextAction?: string }> {
  try {
    // This would call your backend endpoint that wraps OpenAI's analyze function
    const response = await apiRequest("POST", "/api/ai/analyze", {
      question,
      answer,
    });
    return response.json();
  } catch (error) {
    console.error("Error analyzing response:", error);
    throw new Error(`Failed to analyze response: ${(error as Error).message}`);
  }
}

/**
 * Generate personalized advice based on user's insurance needs
 */
export async function generateInsuranceAdvice(answers: { question: string; answer: string }[]): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/advice", { answers });
    return response.json().then(data => data.advice);
  } catch (error) {
    console.error("Error generating insurance advice:", error);
    throw new Error(`Failed to generate insurance advice: ${(error as Error).message}`);
  }
}

export default {
  generateAIResponse,
  analyzeUserResponse,
  generateInsuranceAdvice,
};
