import { getChatContext } from "@/lib/chatContext";

export const getNaturalLanguageResponse = async (data: any, query: string,schema:string , provider:string , model:string , llmApiKey:string) => {
    try {
      const response = await fetch("/api/operations/natural-language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
          query,
          schema,
          provider,
          model,
          apiKey: llmApiKey,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      return result.naturalLanguageResponse;
    } catch (error) {
      console.error("Failed to get natural language response:", error);
      return "Sorry, I couldn't generate a natural language explanation for these results.";
    }
  };

  // actions/chats/index.ts
// actions/chats/index.ts
export const getResponse = async (
  llmApiKey: string,
  userMessage: string,
  dbUrl: string,
  provider: string,
  model: string,
  schema: string,
  dbType: string,
  projectId: string
) => {
  try {
    const response = await fetch("/api/operations/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(llmApiKey && {
          [provider === "gemini" ? "x-gemini-api-key" : "x-open-ai-api-key"]: llmApiKey,
        }),
      },
      body: JSON.stringify({
        prompt: userMessage,
        dbUrl,
        provider,
        model,
        schema,
        dbType,
        context: getChatContext(projectId),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getResponse:", error);
    throw error;
  }
};