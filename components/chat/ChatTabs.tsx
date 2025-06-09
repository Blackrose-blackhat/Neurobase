// components/chat/ChatTabs.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table2, MessageSquare, Loader2, AlertCircle, LoaderPinwheel, LoaderPinwheelIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DataTable } from "./Table/DataTable";
import { Message } from "@/types/chat";
import { TableViewState } from "@/types/table.types";
import { TextShimmerWave } from "../ui/text-shimmer-wave";

interface ChatTabsProps {
  message: Message;
  messageIndex: number;
  tableViewState: { [key: number]: TableViewState };
  onTableViewStateChange: (
    messageIndex: number,
    updates: Partial<TableViewState>
  ) => void;
  onRowSelect: (row: any) => void;
}

export function ChatTabs({
  message,
  messageIndex,
  tableViewState,
  onTableViewStateChange,
  onRowSelect,
}: ChatTabsProps) {
  const hasError = message.content.startsWith("Error:");
  const hasData =
    message.data && Array.isArray(message.data) && message.data.length > 0;
  const isLoading = message.isStreaming;

  if (isLoading) {
    return (
     
      <TextShimmerWave
      className='[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]'
      duration={1}
      spread={1}
      zDistance={1}
      scaleDistance={1.1}
      rotateYDistance={20}
    >
      Thinking...
    </TextShimmerWave>
     
    );
  }

  return (
    <Card className="p-4 bg-muted">
      <Tabs defaultValue="natural" className="w-full">
        <TabsList className="mb-4">
          {hasData && (
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 />
              Table View
            </TabsTrigger>
          )}
          {hasData && (

          <TabsTrigger value="natural" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Natural Language
          </TabsTrigger>
          )}
        </TabsList>

        {hasData && (
          <TabsContent value="table">
            <DataTable
              data={message.data}
              messageIndex={messageIndex}
              tableViewState={tableViewState}
              onTableViewStateChange={onTableViewStateChange}
              onRowSelect={onRowSelect}
            />
          </TabsContent>
        )}

        <TabsContent value="natural">
          {hasError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{message.content}</span>
            </div>
          ) : message.naturalLanguageResponse ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.naturalLanguageResponse}
              </ReactMarkdown>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
