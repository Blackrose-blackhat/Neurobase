"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LlmApiKeyInputProps {
  value: string;
  onChange: (value: string, provider: string, model: string) => void;
  selectedModel?: string;
}

export const LlmApiKeyInput: React.FC<LlmApiKeyInputProps> = ({ 
  value, 
  onChange,
  selectedModel 
}) => {
  const [provider, setProvider] = useState<string>("");

  const handleChange = (newValue: string) => {
    let detectedProvider = "";
    if (/^sk-[A-Za-z0-9]{32,}$/.test(newValue)) {
      detectedProvider = "openai";
    } else if (/^AIza[0-9A-Za-z-_]{30,}$/.test(newValue)) {
      detectedProvider = "gemini";
    } else if (newValue) {
      detectedProvider = "not-supported";
    }
    setProvider(detectedProvider);
    // Pass the current model or default model based on provider
    const defaultModel = detectedProvider === "openai" ? "gpt-3.5-turbo-instruct" : "gemini-pro";
    onChange(newValue, detectedProvider, selectedModel || defaultModel);
  };

  const handleModelChange = (model: string) => {
    onChange(value, provider, model);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="llm-api-key">
          LLM API Key
        </label>
        <Input
          id="llm-api-key"
          type="password"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter your LLM API key"
        />
        {provider && (
          <p className={`text-sm mt-1 ${provider === "not-supported" ? "text-red-500" : "text-green-500"}`}>
            Provider: {provider}
          </p>
        )}
      </div>

      {provider && provider !== "not-supported" && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="model-select">
            Model
          </label>
          <Select
            value={selectedModel}
            onValueChange={handleModelChange}
          >
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {provider === "openai" ? (
                <>
                  <SelectItem value="gpt-3.5-turbo-instruct">GPT-3.5 Turbo Instruct</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                  <SelectItem value="gemini-1.0-flash">gemini-1.0-flash</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};