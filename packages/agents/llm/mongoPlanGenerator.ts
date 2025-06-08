import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { MongoStructredQueryPlan } from "../mongo/types";
import { Provider } from "../../types/modelType.type";
import { buildMongoPrompt } from "./promptBuilder";
import { cleanLLMOutput } from "./outputCleaner";
import dotenv from "dotenv";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  dotenv.config();
}

export interface GeneratePlanInput {
  prompt: string;
  provider: Provider;
  model: string;
  schema: Record<string, any>;
  apiKey?: string; // <-- Add apiKey here
}

export async function generateMongoPlan({
  prompt,
  provider,
  model,
  schema,
  apiKey,
}: GeneratePlanInput): Promise<MongoStructredQueryPlan> {
  // Dynamically set env var for the provider
  if (provider === "openai" && apiKey) {
    process.env.OPENAI_API_KEY = apiKey;
  }
  if (provider === "gemini" && apiKey) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
  }

  const modelConfig =
    provider === "openai"
      ? openai(model === "gpt-4" ? "gpt-4" : "gpt-3.5-turbo-instruct")
      : provider === "gemini"
      ? google(model)
      : undefined;

  if (!modelConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const basePrompt = buildMongoPrompt(prompt, schema);

  const { text } = await generateText({
    model: modelConfig,
    prompt: basePrompt,
  });

  const cleanedText = cleanLLMOutput(text);

  try {
    const result = JSON.parse(cleanedText);
    if (!result.operation || !result.collection) {
      throw new Error("Invalid response structure: missing required fields");
    }
    return result as MongoStructredQueryPlan;
  } catch {
    throw new Error(`Failed to parse LLM output as JSON:\n${text}`);
  }
}
