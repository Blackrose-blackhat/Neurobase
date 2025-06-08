// components/chat/TemporaryChatSwitch.tsx
"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface TemporaryChatSwitchProps {
  isTemporary: boolean
  onToggle: (value: boolean) => void
}

export function TemporaryChatSwitch({ isTemporary, onToggle }: TemporaryChatSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="temporary-chat"
        checked={isTemporary}
        onCheckedChange={onToggle}
      />
      <div className="flex items-center gap-1">
        <Label htmlFor="temporary-chat" className="text-sm text-muted-foreground">
          Temporary Chat
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                When enabled, chat messages won't be saved automatically. 
                You can still manually save the chat using the save button.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}