"use client";

import type React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";

import {
  Loader2,
  Save,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  XCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProject, getProject, closeDatabase, ensureDatabaseReady, saveChatHistory } from "@/lib/db";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { addToChatContext, getChatContext } from "@/lib/chatContext";
import { Message } from "@/types/chat";
import { TableViewState } from "@/types/table.types";
import { DatabaseChatProps } from "@/types/dbConfig.types";
import { getNaturalLanguageResponse } from "@/actions/chats";

import { ChatInput } from "./ChatInput";
import { ChatScrollArea } from "./ChatScrollArea";
import { TemporaryChatSwitch } from "./tempSwitch";
import { motion } from "framer-motion";

interface RowData {
  [key: string]: any;
}

interface EnhancedDatabaseChatProps extends DatabaseChatProps {
  projectName: string;
}

// Retry configuration
const MAX_RETRIES = 3; // Maximum number of retry attempts
const RETRY_DELAY_MS = 1500; // Delay in milliseconds before retrying

export default function DatabaseChat({
  dbUrl,
  schema,
  provider,
  model,
  llmApiKey,
  projectId,
  dbType,
  projectName,
}: EnhancedDatabaseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tableViewState, setTableViewState] = useState<{
    [key: number]: TableViewState;
  }>({});
  const scrollAnchorRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const initialLoadDone = useRef(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const initializeAndLoadChat = async () => {
      if (initialLoadDone.current) return;
      try {
        await ensureDatabaseReady();
        const project = await getProject(projectId);
        if (project?.chatHistory?.messages) {
          setMessages(project.chatHistory.messages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        toast.error("Failed to load chat history. Please refresh the page.", {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      } finally {
        initialLoadDone.current = true;
      }
    };

    initializeAndLoadChat();

    return () => {
      closeDatabase();
    };
  }, [projectId]);

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

  const handleSaveChat = async (projectId: string, currentMessages: Message[]) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveChatHistory(projectId, currentMessages);
      setHasUnsavedChanges(false);
      toast.success("Chat saved successfully", {
        icon: <CheckCircle className="h-4 w-4" />,
      });
    } catch (error) {
      console.error("Failed to save chat history:", error);
      toast.error("Failed to save chat. Please try again.", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !llmApiKey) {
      if (!llmApiKey) {
        toast.error("Please configure an LLM API key for this project.", {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
      return;
    }

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
    }
    
    setIsLoading(true);

    // Add a single loading message to be updated
    const loadingMessageId = Date.now() + "-loading"; // Unique ID for this loading message
    const initialLoadingMessage: Message = {
      role: "assistant",
      content: "Generating response...",
      timestamp: Date.now(),
      isStreaming: true,
      id: loadingMessageId, // Assign a unique ID
    };
    setMessages((prev) => [...prev, initialLoadingMessage]);

    let currentAttempt = 0;
    let assistantResponseReceived = false;

    while (currentAttempt < MAX_RETRIES && !assistantResponseReceived) {
      currentAttempt++;
      const isLastAttempt = currentAttempt === MAX_RETRIES;

      try {
        // Update the loading message content for retries
        if (currentAttempt > 1) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessageId
                ? {
                    ...msg,
                    content: `Retrying... (Attempt ${currentAttempt} of ${MAX_RETRIES})`,
                    isError: false, // Clear error state if retrying
                  }
                : msg
            )
          );
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)); // Delay before retry
        }

        const context = await getChatContext(projectId);

        const response = await fetch('/api/operations/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': provider === 'gemini' ? llmApiKey : '',
            'x-open-ai-api-key': provider === 'openai' ? llmApiKey : '',
          },
          body: JSON.stringify({
            prompt: userMessage,
            dbUrl,
            provider,
            model,
            schema,
            context,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to execute operation');

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
            msg.id === loadingMessageId // Find the specific loading message by its ID
              ? {
                  role: "assistant" as const,
                  content: naturalLanguageResponse,
                  data: data.result,
                  query: data.query,
                  naturalLanguageResponse,
                  timestamp: Date.now(),
                  isStreaming: false, // Streaming finished
                  id: loadingMessageId, // Keep the ID
                }
              : msg
          );
          
          if (!isTemporaryChat) {
            const assistantMessage = updated.find(msg => msg.id === loadingMessageId);
            if (assistantMessage) { // Ensure message is found before adding to context/saving
              addToChatContext(projectId, assistantMessage);
              handleSaveChat(projectId, updated);
            }
          }
          
          return updated;
        });
        assistantResponseReceived = true; // Success, exit loop
        
      } catch (error: any) {
        console.error(`Attempt ${currentAttempt} failed:`, error);
        
        if (isLastAttempt) {
          // Last attempt failed, show final error
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === loadingMessageId
                ? {
                    ...msg,
                    content: `Error: ${error.message || 'An unexpected error occurred'}. Failed after ${MAX_RETRIES} attempts.`,
                    isError: true,
                    isStreaming: false, // No longer streaming
                  }
                : msg
            );
            
            if (!isTemporaryChat) {
              const errorMessage = updated.find(msg => msg.id === loadingMessageId);
              if (errorMessage) {
                addToChatContext(projectId, errorMessage);
                handleSaveChat(projectId, updated);
              }
            }
            return updated;
          });
        } else {
          // Update the message to indicate a retry attempt
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessageId
                ? {
                    ...msg,
                    content: `Error: ${error.message || 'An unexpected error occurred'}. Retrying... (Attempt ${currentAttempt + 1} of ${MAX_RETRIES})`,
                    isError: true,
                    isStreaming: true, // Keep streaming true while retrying
                  }
                : msg
            )
          );
        }
      }
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleBack = () => {
    if (hasUnsavedChanges && !isTemporaryChat) {
      toast.info("You have unsaved changes.", {
        description: "Do you want to save your chat before leaving?",
        duration: 5000,
        action: {
          label: "Save & Exit",
          onClick: () => handleSaveAndNavigate(),
        },
        cancel: {
          label: "Discard & Exit",
          onClick: () => {
            setHasUnsavedChanges(false);
            router.push("/dashboard");
          },
        },
      });
    } else {
      router.push("/dashboard");
    }
  };

  const handleSaveAndNavigate = async () => {
    try {
      await handleSaveChat(projectId, messages);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save chat and navigate:', error);
      toast.error('Failed to save chat before leaving.', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  };

  const isSaveButtonDisabled = useMemo(() => {
    return isSaving || messages.length === 0 || !hasUnsavedChanges;
  }, [isSaving, messages.length, hasUnsavedChanges]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-gradient-to-br from-background via-background to-muted/20 rounded-xl border border-border/50 overflow-hidden shadow-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-none flex justify-between items-center p-4 sm:p-6 border-b border-border/50 bg-card/50 backdrop-blur-sm shadow-md"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="group rounded-full hover:bg-primary/10 transition-colors duration-200"
          >
            <ChevronLeft className="h-4 w-4 mr-1 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
              {projectName}
            </h2>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Ask questions about your data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <TemporaryChatSwitch
            isTemporary={isTemporaryChat}
            onToggle={setIsTemporaryChat}
          />
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveChat(projectId, messages)}
              disabled={isSaveButtonDisabled}
              className="bg-background/50 hover:bg-background/80 border-border/50 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Chat
            </Button>
            {hasUnsavedChanges && !isTemporaryChat && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-background"
                title="Unsaved changes"
              />
            )}
          </div>
        </div>
      </motion.div>

      <ChatScrollArea
        messages={messages}
        isLoading={isLoading}
        tableViewState={tableViewState}
        onTableViewStateChange={updateTableViewState}
        onRowSelect={(row) => {
          setSelectedRow(row);
          setIsDialogOpen(true);
        }}
        scrollAnchorRef={scrollAnchorRef}
      />

      <div className="flex-none p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          inputRef={inputRef}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-card text-card-foreground p-6 rounded-lg shadow-xl">
          <DialogHeader className="pb-4 border-b border-border/50 mb-4">
            <DialogTitle className="text-2xl font-semibold">Row Details</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Detailed view of the selected data row.
            </DialogDescription>
          </DialogHeader>
          {selectedRow ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="bg-muted/30 p-3 rounded-md flex flex-col">
                  <span className="font-medium text-muted-foreground mb-1">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                  </span>
                  <span className="font-mono text-foreground break-all whitespace-pre-wrap">
                    {value === null || value === undefined ? (
                      <span className="text-muted-foreground italic">NULL</span>
                    ) : typeof value === "object" ? (
                      <pre className="whitespace-pre-wrap font-sans">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No row data selected.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
