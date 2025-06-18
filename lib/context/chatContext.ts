import { Message } from "@/types/chat";

interface ChatContext {
  messages: Message[];
  databaseSchema?: Record<string, any>;
  lastQuery?: string;
  lastOperation?: string;
  lastCollection?: string;
}

class ChatContextManager {
  private contexts: Map<string, ChatContext> = new Map();

  createContext(chatId: string) {
    this.contexts.set(chatId, {
      messages: [],
      databaseSchema: undefined,
      lastQuery: undefined,
      lastOperation: undefined,
      lastCollection: undefined,
    });
  }

  getContext(chatId: string): ChatContext | undefined {
    return this.contexts.get(chatId);
  }

  updateContext(chatId: string, updates: Partial<ChatContext>) {
    const context = this.getContext(chatId);
    if (context) {
      this.contexts.set(chatId, { ...context, ...updates });
    }
  }

  addMessage(chatId: string, message: Message) {
    const context = this.getContext(chatId);
    if (context) {
      context.messages.push(message);
      
      // Update context based on message content
      if (message.data) {
        if (message.data.databaseName) {
          // This is a database overview response
          context.lastOperation = 'show_database';
        } else if (Array.isArray(message.data)) {
          // This is a query result
          context.lastOperation = 'query';
          if (message.data.length > 0) {
            // Try to infer the collection from the first document
            const firstDoc = message.data[0];
            if (firstDoc._id) {
              // This is likely a MongoDB document
              context.lastCollection = firstDoc.collection;
            }
          }
        }
      }
      
      // Store the last query
      if (message.role === 'user') {
        context.lastQuery = message.content;
      }
    }
  }

  getLastMessages(chatId: string, count: number = 5): Message[] {
    const context = this.getContext(chatId);
    if (context) {
      return context.messages.slice(-count);
    }
    return [];
  }

  clearContext(chatId: string) {
    this.contexts.delete(chatId);
  }

  // Helper method to get conversation summary
  getConversationSummary(chatId: string): string {
    const context = this.getContext(chatId);
    if (!context) return '';

    const summary = [];
    if (context.lastOperation) {
      summary.push(`Last operation: ${context.lastOperation}`);
    }
    if (context.lastCollection) {
      summary.push(`Last collection: ${context.lastCollection}`);
    }
    if (context.lastQuery) {
      summary.push(`Last query: ${context.lastQuery}`);
    }

    return summary.join('\n');
  }
}

// Create a singleton instance
export const chatContextManager = new ChatContextManager(); 