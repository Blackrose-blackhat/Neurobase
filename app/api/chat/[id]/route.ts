import { NextResponse } from 'next/server';
import { saveChatHistory, getChatHistory } from '@/lib/db';

const DB_NAME = "dbgpt";
const STORE_NAME = "chats";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  query?: string;
  timestamp: number;
}

// GET handler to retrieve chat history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await getChatHistory(params.id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}

// POST handler to save chat history
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { messages } = await request.json();
    await saveChatHistory(params.id, messages);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save chat history:', error);
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    );
  }
} 