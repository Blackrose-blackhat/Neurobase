"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LlmApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const LlmApiKeyInput: React.FC<LlmApiKeyInputProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label>LLM API Key</Label>
      <Input
        type="password"
        placeholder="sk-..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};