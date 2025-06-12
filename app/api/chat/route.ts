import { NextResponse } from "next/server";
import { Message } from "@/types/chat";
import { chatContextManager } from "@/lib/context/chatContext";

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();

    // Get chat context
    const context = chatContextManager.getContext(chatId);
    if (!context) {
      return NextResponse.json(
        { error: "Chat context not found" },
        { status: 400 }
      );
    }

    // Get conversation summary for context
    const conversationSummary = chatContextManager.getConversationSummary(chatId);
    
    // Add context to the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === "user") {
      lastUserMessage.content = `${lastUserMessage.content}\n\nContext:\n${conversationSummary}`;
    }

    // Process the message with context
    const response = await processMessage(messages);

    // Add the response to chat context
    chatContextManager.addMessage(chatId, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}

async function processMessage(messages: Message[]): Promise<Message> {
  // Your existing message processing logic here
  // This is where you'd integrate with your LLM or other processing
  return {
    role: "assistant",
    content: "This is a placeholder response. Implement your message processing logic here.",
    timestamp: Date.now(),
  };
} 