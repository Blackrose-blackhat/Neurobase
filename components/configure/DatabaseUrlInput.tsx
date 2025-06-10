"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatabaseType } from "@/types/dbConfig.types";
import { URL_PATTERNS } from "@/constants/dbConfig.constant";
import Image from "next/image";
import { cn } from "@/lib/utils";

const DB_ICONS: { [key: string]: string } = {
  mongodb: "/images/db-icons/mongodb.svg",
  postgresql: "/images/db-icons/postgresql.svg",
  mysql: "/images/db-icons/mysql.svg",
  sqlite: "/images/db-icons/sqlite.svg",
  default: "/images/db-icons/database.svg",
};

const getDatabaseTypeFromUrl = (url: string): string => {
  if (url.includes("mongodb")) return "mongodb";
  if (url.includes("postgresql") || url.includes("postgres")) return "postgresql";
  if (url.includes("mysql")) return "mysql";
  if (url.includes("sqlite")) return "sqlite";
  return "default";
};

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
  const detectedDbType = getDatabaseTypeFromUrl(value);
  const dbIconSrc = DB_ICONS[detectedDbType] || DB_ICONS.default;
  const dbNameDisplay = detectedDbType !== 'default'
    ? detectedDbType.charAt(0).toUpperCase() + detectedDbType.slice(1)
    : 'Unknown';

  const isRecognized = detectedDbType !== 'default' && value.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="database-url" className="flex items-center gap-2">
        Database URL
        
      </Label>
      <Input
        id="database-url"
        placeholder={URL_PATTERNS[dbType]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "pr-4",
          isRecognized ? "border-green-500 focus-visible:ring-green-500" : "",
          !isRecognized && value.length > 0 ? "border-destructive focus-visible:ring-destructive" : ""
        )}
      />
      {value.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Image
              src={dbIconSrc}
              alt={dbNameDisplay}
              width={26}
              height={26}
              className="rounded-sm"
            />
            <span className={cn(isRecognized ? "text-green-500" : "text-destructive")}>
              {dbNameDisplay}
            </span>
          </div>
        )}
    </div>
  );
};