"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // shadcn input
import { useFormData } from "@/hooks/useFormData";
import { buildUrlByType, parseUrlByType } from "@/lib/utils";
import { AdvancedSettings } from "../configure/AdvancesSettings";
import { DatabaseTypeSelector } from "../configure/DatabaseTypeSelector";
import { DatabaseUrlInput } from "../configure/DatabaseUrlInput";
import { LlmApiKeyInput } from "../configure/LlmApiKeyInput";
import { Loader2 } from "lucide-react";

import { FormData, ProjectData } from "@/types/dbConfig.types";
import { handleConfigSubmit } from "@/actions/config/configProject";

interface ConfigureProjectFormProps {
  onSubmit?: (data: ProjectData) => void; // accepts ProjectData now
  initialData?: Partial<FormData>;
  onClose?: () => void; // optional close handler
}

export const ConfigureProjectForm: React.FC<ConfigureProjectFormProps> = ({
  onSubmit,
  initialData,
  onClose, // make sure to accept onClose
}) => {
  const {
    formData,
    isAdvancedOpen,
    setIsAdvancedOpen,
    updateFormData,
    updateConfig,
  } = useFormData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize form with provided data
  useEffect(() => {
    if (initialData) {
      updateFormData(initialData);
    }
  }, [initialData, updateFormData]);

  // Generate URL from advanced config when needed
  const generatedUrl = useMemo(() => {
    if (!isAdvancedOpen) return "";
    return buildUrlByType(formData.config, formData.dbType);
  }, [formData.config, formData.dbType, isAdvancedOpen]);

  // Update URL when advanced config changes
  useEffect(() => {
    if (isAdvancedOpen && generatedUrl && generatedUrl !== formData.dbUrl) {
      updateFormData({ dbUrl: generatedUrl });
    }
  }, [generatedUrl, isAdvancedOpen, formData.dbUrl, updateFormData]);

  // Parse URL into advanced config when URL changes
  useEffect(() => {
    if (!formData.dbUrl || !isAdvancedOpen) return;

    const parsedConfig = parseUrlByType(formData.dbUrl, formData.dbType);
    if (Object.keys(parsedConfig).length > 0) {
      updateConfig(parsedConfig);
    }
  }, [formData.dbUrl, formData.dbType, isAdvancedOpen, updateConfig]);

  const handleDbTypeChange = (newDbType: "postgres" | "mongodb") => {
    updateFormData({
      dbType: newDbType,
      dbUrl: "", // Reset URL when changing DB type
    });
    // Reset config when changing DB type
    updateConfig({
      host: "",
      port: "",
      dbName: "",
      user: "",
      password: "",
    });
  };

  // Local submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await handleConfigSubmit(e, formData, onSubmit);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      {/* Project Name Field */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="project-name">
          Project Name
        </label>
        <Input
          id="project-name"
          type="text"
          value={formData.name || ""}
          onChange={e => updateFormData({ name: e.target.value })}
          placeholder="Enter project name"
          required
        />
         {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>

      <DatabaseTypeSelector
        value={formData.dbType}
        onChange={handleDbTypeChange}
      />

      <DatabaseUrlInput
        value={formData.dbUrl}
        onChange={(url) => updateFormData({ dbUrl: url })}
        dbType={formData.dbType}
      />

      <LlmApiKeyInput
        value={formData.llmApiKey}
        selectedModel={formData.model}
        onChange={(key, provider, model) => updateFormData({ 
          llmApiKey: key, 
          provider,
          model 
        })}
      />
      <AdvancedSettings
        config={formData.config}
        dbType={formData.dbType}
        onConfigChange={updateConfig}
        onOpenChange={setIsAdvancedOpen}
      />

      <div className="pt-2 text-right">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect & Save"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ConfigureProjectForm;
