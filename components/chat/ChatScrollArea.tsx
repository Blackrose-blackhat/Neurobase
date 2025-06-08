// components/chat/ChatScrollArea.tsx
"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Clock, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Message } from "@/types/chat"
import { StreamingMessage } from "./StreamingMessage"
import { ChatTabs } from "./ChatTabs"
import { TableViewState } from "@/types/table.types"
import { useEffect, useRef } from "react"

interface ChatScrollAreaProps {
  messages: Message[]
  isLoading: boolean
  tableViewState: { [key: number]: TableViewState }
  onTableViewStateChange: (index: number, state: Partial<TableViewState>) => void
  onRowSelect: (row: any) => void
  scrollAnchorRef: React.RefObject<HTMLDivElement>
}

export function ChatScrollArea({
  messages,
  isLoading,
  tableViewState,
  onTableViewStateChange,
  onRowSelect,
  scrollAnchorRef,
}: ChatScrollAreaProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4" ref={scrollViewportRef}>
          {messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                {message.role === "user" ? (
                  <div className="text-sm">{message.content}</div>
                ) : (
                  <ChatTabs
                    message={message}
                    messageIndex={index}
                    tableViewState={tableViewState}
                    onTableViewStateChange={onTableViewStateChange}
                    onRowSelect={onRowSelect}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={scrollAnchorRef} className="h-4" />
        </div>
      </ScrollArea>
    </div>
  )
}