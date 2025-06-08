// components/chat/ChatInput.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Database, Loader2, Send } from "lucide-react"
import { useRef } from "react"

interface ChatInputProps {
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex-none p-6 border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask a question about your database structure or data..."
            disabled={isLoading}
            className="pr-12 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-primary hover:bg-primary/90 shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Ask questions about your database structure, data, or write SQL queries
      </p>
    </div>
  )
}