import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { Provider } from "@/types/modelType.type";

export async function POST(req: NextRequest) {
  try {
    const { data, query, schema, provider, model, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Set the API key based on provider
    if (provider === "openai") {
      process.env.OPENAI_API_KEY = apiKey;
    } else if (provider === "gemini") {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    }

    // Configure the model based on provider
    const modelConfig =
      provider === "openai"
        ? openai(model === "gpt-4" ? "gpt-4" : "gpt-3.5-turbo-instruct")
        : provider === "gemini"
        ? google(model === "gemini-2.0-flash" ? "gemini-2.0-flash" : "gemini-1.5-flash")
        : undefined;

    if (!modelConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Create the prompt for natural language explanation
    const prompt = `
You are a helpful and concise database assistant. Explain the following query results in natural language.
Make it conversational, easy to understand, and well-formatted using Markdown.

Query: ${query}

Database Schema:
${JSON.stringify(schema, null, 2)}

Query Results:
${JSON.stringify(data, null, 2)}

Please provide a natural language explanation of these results. Focus on:
1.  **What the data shows**: Summarize the main information.
2.  **Notable patterns or insights**: Point out any interesting trends, anomalies, or relationships.
3.  **Key numbers or statistics**: Highlight important counts, sums, averages, etc.
4.  **Formatting**: Use Markdown for headings, bullet points, bold text, or code blocks where appropriate to enhance readability.
5.  **Conciseness**: Keep the explanation brief and to the point.
 provide all the data in bullet points with heading paragraphs properly formatted good spacing
Your response should be a natural language explanation, no JSON or code.`;

    // Generate the natural language response
    const { text } = await generateText({
      model: modelConfig,
      prompt: prompt,
    });

    return NextResponse.json({ naturalLanguageResponse: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 