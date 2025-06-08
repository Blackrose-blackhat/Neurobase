"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

import {
  Loader2,
  Save,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProject, getProject } from "@/lib/db";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { addToChatContext } from "@/lib/chatContext";
import { Message } from "@/types/chat";
import { TableViewState } from "@/types/table.types";
import { DatabaseChatProps } from "@/types/dbConfig.types";
import { getNaturalLanguageResponse, getResponse } from "@/actions/chats";

import { ChatInput } from "./ChatInput";
import { ChatScrollArea } from "./ChatScrollArea";
import { TemporaryChatSwitch } from "./tempSwitch";

interface RowData {
  [key: string]: any;
}

export default function DatabaseChat({
  dbUrl,
  schema,
  provider,
  model,
  llmApiKey,
  projectId,
  dbType,
}: DatabaseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tableViewState, setTableViewState] = useState<{
    [key: number]: TableViewState;
  }>({});
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const initialLoadDone = useRef(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (initialLoadDone.current) return;

      try {
        const project = await getProject(projectId);
        if (project?.chatHistory?.messages) {
          setMessages(project.chatHistory.messages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        initialLoadDone.current = true;
      }
    };
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && !isTemporaryChat) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [messages, isTemporaryChat]);

  const getTableViewState = (messageIndex: number): TableViewState => {
    return (
      tableViewState[messageIndex] || {
        currentPage: 1,
        itemsPerPage: 10,
        searchTerm: "",
        hiddenColumns: new Set(),
        sortColumn: null,
        sortDirection: "asc",
      }
    );
  };

  const updateTableViewState = (
    messageIndex: number,
    updates: Partial<TableViewState>
  ) => {
    setTableViewState((prev) => ({
      ...prev,
      [messageIndex]: { ...getTableViewState(messageIndex), ...updates },
    }));
  };

  const saveChatHistory = async (projectId: string, messages: Message[]) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const project = await getProject(projectId);
      if (project) {
        await saveProject({
          ...project,
          chatHistory: { messages },
        });
        setHasUnsavedChanges(false);
        toast.success("Chat saved successfully", {
          icon: <CheckCircle className="h-4 w-4" />,
        });
      }
    } catch (error) {
      console.error("Failed to save chat history:", error);
      toast.error("Failed to save chat", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    
    if (!isTemporaryChat) {
      addToChatContext(projectId, newUserMessage);
      setHasUnsavedChanges(true);
    }
    
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      const data = await getResponse(
        llmApiKey,
        userMessage,
        dbUrl,
        provider,
        model,
        schema,
        dbType,
        projectId
      );

      if (data.error) throw new Error(data.error);

      const naturalLanguageResponse = await getNaturalLanguageResponse(
        data.result,
        data.query,
        schema,
        provider,
        model,
        llmApiKey
      );

      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg === loadingMessage
            ? {
                role: "assistant" as const,
                content: "",
                data: data.result,
                query: data.query,
                naturalLanguageResponse,
                timestamp: Date.now(),
              }
            : msg
        );
        
        if (!isTemporaryChat) {
          const assistantMessage = updated[updated.length - 1];
          addToChatContext(projectId, assistantMessage);
          saveChatHistory(projectId, updated);
        }
        
        return updated;
      });
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: error.message,
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const updated = [...prev, errorMessage];
        
        if (!isTemporaryChat) {
          addToChatContext(projectId, errorMessage);
          saveChatHistory(projectId, updated);
        }
        
        return updated;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleBack = () => {
    router.push("/dashboard")
  };

  const handleSaveAndNavigate = async () => {
    try {
      await saveChatHistory(projectId, messages);
      setHasUnsavedChanges(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save chat:', error);
      toast.error('Failed to save chat', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gradient-to-br from-background via-background to-muted/20 rounded-xl border border-border/50 overflow-hidden shadow-lg">
      <div className="flex-none flex justify-between items-center p-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Database Chat</h2>
            <p className="text-sm text-muted-foreground">
              Ask questions about your data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <TemporaryChatSwitch
            isTemporary={isTemporaryChat}
            onToggle={setIsTemporaryChat}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveChatHistory(projectId, messages)}
            disabled={isSaving || messages.length === 0}
            className="bg-background/50 hover:bg-background/80 border-border/50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Chat
          </Button>
        </div>
      </div>

      <ChatScrollArea
        messages={messages}
        isLoading={isLoading}
        tableViewState={tableViewState}
        onTableViewStateChange={updateTableViewState}
        onRowSelect={setSelectedRow}
        scrollAnchorRef={scrollAnchorRef}
      />

      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Row Details</DialogTitle>
          </DialogHeader>
          {selectedRow && (
            <div className="space-y-4">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4">
                  <div className="font-medium text-sm text-muted-foreground">
                    {key}
                  </div>
                  <div className="col-span-2 font-mono text-sm break-all">
                    {value === null || value === undefined ? (
                      <span className="text-muted-foreground italic">null</span>
                    ) : typeof value === "object" ? (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
