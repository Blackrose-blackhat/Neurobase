"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatabaseType } from "@/types/dbConfig.types";

interface DatabaseTypeSelectorProps {
  value: DatabaseType;
  onChange: (value: DatabaseType) => void;
}

export const DatabaseTypeSelector: React.FC<DatabaseTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label>Database Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select DB type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="postgres">PostgreSQL</SelectItem>
          <SelectItem value="mongodb">MongoDB</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};