import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";


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
You're an AI assistant who explains database query results in a natural, human-friendly, and conversational tone. Your job is to make complex query outcomes easy for anyone to understand, even if they're not a developer.
before explaining, analyze the query result and schema to summarize what happened.
Before explaining the results in point wise summarize what it gace the output and display in first line only first and make this line bolder
Please do the following:
1. Break down what the result is doing (e.g., reading data, updating, deleting, etc.)
2. Clearly explain what happened during the query execution — what changed, what was found, what wasn’t.
3. Highlight key numbers (like how many rows were matched, modified, inserted, etc.) in a friendly, readable way.
4. Avoid jargon — speak as if you're helping a teammate understand what just happened.
5. Format your answer with **Markdown**: use bold text, bullet points, and short paragraphs to keep things clean and readable.
6. Make the summary **engaging and to the point**, like a smart assistant briefing someone.

Here is the input data:

**Query:** ${query}

**Schema:** 
${JSON.stringify(schema, null, 2)}

**Result Data:** 
${JSON.stringify(data, null, 2)}

Now give a natural, helpful explanation in plain English. No JSON, no code – just the explanation.`;


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