"use client";

import { useState, useEffect, useId } from "react";
import { Message } from "@/types/chat";
import { TableViewState } from "@/types/table.types";
import { chatContextManager } from "@/lib/context/chatContext";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tableViewState, setTableViewState] = useState<{
    [key: number]: TableViewState;
  }>({});
  const chatId = useId(); // Generate a unique ID for this chat session

  // Initialize chat context when component mounts
  useEffect(() => {
    chatContextManager.createContext(chatId);
    return () => {
      chatContextManager.clearContext(chatId);
    };
  }, [chatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          chatId, // Pass the chat ID to the API
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      // Add both user and assistant messages to context
      chatContextManager.addMessage(chatId, userMessage);
      chatContextManager.addMessage(chatId, data);

      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Failed to get response from the server.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of the existing code ...
} 