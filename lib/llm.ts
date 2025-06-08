import { Message } from '@/types/chat';

export async function generateSQL(
  prompt: string,
  schema: any,
  dbType: string,
  context: Message[] = []
): Promise<string> {
  // Format context for the prompt
  const contextStr = context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  // Create a prompt that includes the context
  const fullPrompt = context.length > 0
    ? `Previous conversation context:\n${contextStr}\n\nCurrent question: ${prompt}`
    : prompt;

  // TODO: Implement actual LLM call here
  // For now, return a placeholder query
  return `SELECT * FROM ${dbType === 'postgres' ? 'information_schema.tables' : 'system.tables'}`;
} 