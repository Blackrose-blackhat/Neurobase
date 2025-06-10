"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Loader2, Info, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHotkeys } from "react-hotkeys-hook";

interface LlmApiKeyInputProps {
  value: string;
  onChange: (value: string, provider: string, model: string) => void;
  selectedModel?: string;
}

const MODEL_DESCRIPTIONS = {
  "gpt-3.5-turbo-instruct": {
    description: "Fast and efficient for most tasks",
    capabilities: "Good for general purpose tasks and quick responses",
    maxTokens: "4,096 tokens",
    cost: "Lowest cost option",
  },
  "gpt-4": {
    description: "Most capable model for complex tasks",
    capabilities: "Excellent for complex reasoning and detailed responses",
    maxTokens: "8,192 tokens",
    cost: "Higher cost, best results",
  },
  "gpt-4-turbo": {
    description: "Latest model with improved performance",
    capabilities: "Enhanced capabilities with faster response times",
    maxTokens: "128,000 tokens",
    cost: "Premium pricing",
  },
  "gemini-2.0-flash": {
    description: "Fastest Gemini model",
    capabilities: "Quick responses with good quality",
    maxTokens: "32,768 tokens",
    cost: "Cost-effective",
  },
  "gemini-1.0-flash": {
    description: "Stable and reliable",
    capabilities: "Consistent performance for standard tasks",
    maxTokens: "32,768 tokens",
    cost: "Most cost-effective",
  },
};

export const LlmApiKeyInput: React.FC<LlmApiKeyInputProps> = ({ 
  value, 
  onChange,
  selectedModel 
}) => {
  const [provider, setProvider] = useState<string>("");
  const [currentModel, setCurrentModel] = useState<string>(selectedModel || "");
  const [isValidating, setIsValidating] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Keyboard shortcuts
  useHotkeys('ctrl+k', (e) => {
    e.preventDefault();
    const input = document.getElementById('llm-api-key');
    input?.focus();
  });

  useHotkeys('ctrl+m', (e) => {
    e.preventDefault();
    if (provider && provider !== "not-supported") {
      const select = document.getElementById('model-select');
      select?.click();
    }
  });

  useEffect(() => {
    if (selectedModel) {
      setCurrentModel(selectedModel);
    }
  }, [selectedModel]);

  const handleChange = (newValue: string) => {
    setIsValidating(true);
    
    // Simulate API key validation delay
    setTimeout(() => {
      let detectedProvider = "";
      if (/^sk-[A-Za-z0-9]{32,}$/.test(newValue)) {
        detectedProvider = "openai";
      } else if (/^AIza[0-9A-Za-z-_]{30,}$/.test(newValue)) {
        detectedProvider = "gemini";
      } else if (newValue) {
        detectedProvider = "not-supported";
      }
      setProvider(detectedProvider);
      
      if (detectedProvider && !currentModel) {
        const defaultModel = detectedProvider === "openai" ? "gpt-3.5-turbo-instruct" : "gemini-2.0-flash";
        setCurrentModel(defaultModel);
        onChange(newValue, detectedProvider, defaultModel);
      } else {
        onChange(newValue, detectedProvider, currentModel);
      }
      setIsValidating(false);
    }, 500);
  };

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    onChange(value, provider, model);
  };

  const getProviderIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (!provider) return null;
    return provider === "not-supported" ? (
      <XCircle className="h-4 w-4 text-destructive" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    );
  };

  const getProviderText = () => {
    if (isValidating) return "Validating...";
    if (!provider) return "";
    return provider === "not-supported" 
      ? "Unsupported API key format" 
      : `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key detected`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label 
            htmlFor="llm-api-key" 
            className="text-sm font-medium flex items-center gap-2"
          >
            LLM API Key
            {getProviderIcon()}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter your API key to enable AI features</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Press Ctrl+K to focus this field
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <button
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Keyboard className="h-3 w-3" />
            Shortcuts
          </button>
        </div>

        {showKeyboardShortcuts && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md space-y-1">
            <p>Keyboard Shortcuts:</p>
            <ul className="list-disc list-inside">
              <li>Ctrl+K: Focus API key input</li>
              <li>Ctrl+M: Open model selector</li>
            </ul>
          </div>
        )}

        <div className="relative">
          <Input
            id="llm-api-key"
            type="password"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter your LLM API key"
            className={cn(
              "pr-8",
              provider === "not-supported" && "border-destructive focus-visible:ring-destructive",
              provider && provider !== "not-supported" && "border-green-500 focus-visible:ring-green-500"
            )}
          />
          {isValidating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {provider && (
          <p className={cn(
            "text-sm mt-1 flex items-center gap-2",
            provider === "not-supported" ? "text-destructive" : "text-green-500"
          )}>
            {getProviderText()}
          </p>
        )}
      </div>

      {provider && provider !== "not-supported" && (
        <div className="space-y-2">
          <Label 
            htmlFor="model-select" 
            className="text-sm font-medium flex items-center gap-2"
          >
            Model
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select the AI model to use</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Press Ctrl+M to open model selector
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select
            value={currentModel}
            onValueChange={handleModelChange}
          >
            <SelectTrigger 
              id="model-select"
              className={cn(
                "w-full",
                currentModel ? "border-green-500 focus-visible:ring-green-500" : ""
              )}
            >
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {provider === "openai" ? (
                <>
                  {Object.entries(MODEL_DESCRIPTIONS)
                    .filter(([key]) => key.startsWith('gpt'))
                    .map(([value, info]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center space-x-2 flex-row  justify-between w-full">
                          <span>{value}</span>
                          <span className="text-xs text-muted-foreground">{info.cost}</span>
                        </div>
                      </SelectItem>
                    ))}
                </>
              ) : (
                <>
                  {Object.entries(MODEL_DESCRIPTIONS)
                    .filter(([key]) => key.startsWith('gemini'))
                    .map(([value, info]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center space-x-2 flex-row  justify-between w-full">
                          <span>{value}</span>
                          <span className="text-xs text-muted-foreground">{info.cost}</span>
                        </div>
                      </SelectItem>
                    ))}
                </>
              )}
            </SelectContent>
          </Select>
          {currentModel && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Selected model: {currentModel}</p>
              <div className="text-xs space-x-2">
                <p>{MODEL_DESCRIPTIONS[currentModel as keyof typeof MODEL_DESCRIPTIONS].description}</p>
                <p>Max tokens: {MODEL_DESCRIPTIONS[currentModel as keyof typeof MODEL_DESCRIPTIONS].maxTokens}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};