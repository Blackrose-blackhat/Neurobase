'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Save } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveProject, getProject } from "@/lib/db";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  query?: string;
  timestamp: number;
}

interface DatabaseChatProps {
  dbUrl: string;
  schema: any;
  provider: string;
  model: string;
  llmApiKey?: string;
  projectId: string;
  dbType: string;
}

export default function DatabaseChat({ dbUrl, schema, provider, model, llmApiKey, projectId, dbType }: DatabaseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const project = await getProject(projectId);
        if (project?.chatHistory?.messages) {
          setMessages(project.chatHistory.messages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [projectId]);

  const saveChatHistory = async (projectId: string, messages: Message[]) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const project = await getProject(projectId);
      if (project) {
        await saveProject({
          ...project,
          chatHistory: { messages }
        });
        toast.success('Chat history saved successfully');
      }
    } catch (error) {
      console.error('Failed to save chat history:', error);
      toast.error('Failed to save chat history');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/operations/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llmApiKey && {
            [provider === 'gemini' ? 'x-gemini-api-key' : 'x-open-ai-api-key']: llmApiKey
          })
        },
        body: JSON.stringify({
          prompt: userMessage,
          dbUrl,
          provider,
          model,
          schema,
          dbType: dbType
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const newAssistantMessage: Message = {
        role: 'assistant',
        content: 'Here are the results:',
        data: data.result,
        query: data.query,
        timestamp: Date.now()
      };
      setMessages(prev => {
        const updatedMessages = [...prev, newAssistantMessage];
        // Save chat after assistant's reply
        saveChatHistory(projectId, updatedMessages);
        return updatedMessages;
      });
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: Date.now()
      };
      setMessages(prev => {
        const updatedMessages = [...prev, errorMessage];
        // Save chat even if there's an error
        saveChatHistory(projectId, updatedMessages);
        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return <p>No results found</p>;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="rounded-md border border-border w-full">
        <div className="w-full overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(column => (
                    <TableHead key={column} className="font-medium whitespace-nowrap px-4">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map(column => (
                      <TableCell key={column} className="whitespace-nowrap px-4">
                        {JSON.stringify(row[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-background text-foreground">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Database Chat</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => saveChatHistory(projectId, messages)}
          disabled={isSaving || messages.length === 0}
          className="hover:bg-secondary hover:text-secondary-foreground"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Chat
        </Button>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <Card key={i} className={`p-4 ${
              message.role === 'user' 
                ? 'bg-secondary text-secondary-foreground' 
                : 'bg-card text-card-foreground'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-foreground">{message.content}</div>
              {message.query && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <div className="font-mono bg-muted p-2 rounded">
                    {message.query}
                  </div>
                </div>
              )}
              {message.data && (
                <div className="mt-4">
                  {renderTable(message.data)}
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your database..."
            disabled={isLoading}
            className="flex-1 bg-background text-foreground border-border"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}