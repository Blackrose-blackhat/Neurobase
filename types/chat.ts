export interface Message {
  role: "user" | "assistant";
  content: string;
  data?: any;
  query?: string;
  timestamp: number;
  isStreaming?: boolean;
  naturalLanguageResponse?: string;
} 