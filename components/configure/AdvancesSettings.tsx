"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { DB_DEFAULTS } from "@/constants/dbConfig.constant";

export type DatabaseType = "postgres" | "mongodb";

export interface DatabaseConfig {
  host: string;
  port: string;
  dbName: string;
  user: string;
  password: string;
}

interface AdvancedSettingsProps {
  config: DatabaseConfig;
  dbType: DatabaseType;
  onConfigChange: (updates: Partial<DatabaseConfig>) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  config,
  dbType,
  onConfigChange,
  onOpenChange,
}) => {
  const handleInputChange = (field: keyof DatabaseConfig) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onConfigChange({ [field]: e.currentTarget.value });
  };

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      onValueChange={(val) => onOpenChange(!!val)}
    >
      <AccordionItem value="advanced">
        <AccordionTrigger className="cursor-pointer">Advanced Settings</AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-2">
            <div className="col-span-2 space-y-2">
              <Label>Host</Label>
              <Input
                placeholder="localhost"
                value={config.host}
                onChange={handleInputChange("host")}
              />
            </div>

            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                placeholder={DB_DEFAULTS[dbType]?.port || ""}
                value={config.port}
                onChange={handleInputChange("port")}
              />
            </div>

            <div className="space-y-2">
              <Label>Database Name</Label>
              <Input
                placeholder="mydb"
                value={config.dbName}
                onChange={handleInputChange("dbName")}
              />
            </div>

            {dbType === "postgres" && (
              <>
                <div>
                  <Label>User</Label>
                  <Input
                    placeholder={DB_DEFAULTS.postgres.user || ""}
                    value={config.user}
                    onChange={handleInputChange("user")}
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={config.password}
                    onChange={handleInputChange("password")}
                  />
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
