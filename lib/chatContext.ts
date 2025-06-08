import { Message } from '@/types/chat';

// In-memory store for chat contexts
const chatContexts: { [projectId: string]: Message[] } = {};

// Maximum number of messages to keep in context
const MAX_CONTEXT_LENGTH = 10;

export function getChatContext(projectId: string): Message[] {
  return chatContexts[projectId] || [];
}

export function addToChatContext(projectId: string, message: Message): void {
  if (!chatContexts[projectId]) {
    chatContexts[projectId] = [];
  }

  // Add new message
  chatContexts[projectId].push(message);

  // Keep only the last MAX_CONTEXT_LENGTH messages
  if (chatContexts[projectId].length > MAX_CONTEXT_LENGTH) {
    chatContexts[projectId] = chatContexts[projectId].slice(-MAX_CONTEXT_LENGTH);
  }
}

export function clearChatContext(projectId: string): void {
  delete chatContexts[projectId];
}

export function getContextSummary(projectId: string): string {
  const context = getChatContext(projectId);
  if (context.length === 0) return '';

  return context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
} 