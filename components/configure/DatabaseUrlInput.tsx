"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatabaseType } from "@/types/dbConfig.types";
import { URL_PATTERNS } from "@/constants/dbConfig.constant";

interface DatabaseUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  dbType: DatabaseType;
}

export const DatabaseUrlInput: React.FC<DatabaseUrlInputProps> = ({
  value,
  onChange,
  dbType,
}) => {
  return (
    <div className="space-y-2">
      <Label>Database URL</Label>
      <Input
        placeholder={URL_PATTERNS[dbType]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};