import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { Provider } from "../../types/modelType.type";
import { buildPostgresPrompt } from "./promptBuilder"; // You should implement this
import { cleanLLMOutput } from "./outputCleaner";
import dotenv from "dotenv";

// Define your PostgresStructuredQueryPlan type as needed
export interface PostgresStructuredQueryPlan {
  operation: string;
  table: string;
  fields?: string[];
  values?: Record<string, any>;
  where?: string;
  // ...add more as needed
}

export interface GeneratePostgresPlanInput {
  prompt: string;
  provider: Provider;
  model: string;
  schema: Record<string, any>;
  apiKey?: string;
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  dotenv.config();
}

export async function generatePostgresPlan({
  prompt,
  provider,
  model,
  schema,
  apiKey,
}: GeneratePostgresPlanInput): Promise<PostgresStructuredQueryPlan> {
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

  const basePrompt = buildPostgresPrompt(prompt, schema);

  const { text } = await generateText({
    model: modelConfig,
    prompt: basePrompt,
  });

  const cleanedText = cleanLLMOutput(text);

  try {
    const result = JSON.parse(cleanedText);
    if (!result.operation || !result.table) {
      throw new Error("Invalid response structure: missing required fields");
    }
    return result as PostgresStructuredQueryPlan;
  } catch {
    throw new Error(`Failed to parse LLM output as JSON:\n${text}`);
  }
}