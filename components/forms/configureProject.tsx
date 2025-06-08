"use client";

import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // shadcn input
import { useFormData } from "@/hooks/useFormData";
import { buildUrlByType, parseUrlByType } from "@/lib/utils";
import { AdvancedSettings } from "../configure/AdvancesSettings";
import { DatabaseTypeSelector } from "../configure/DatabaseTypeSelector";
import { DatabaseUrlInput } from "../configure/DatabaseUrlInput";
import { LlmApiKeyInput } from "../configure/LlmApiKeyInput";

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
    const result = await handleConfigSubmit(e, formData, onSubmit);
    // Optionally check result for errors before closing
    console.log("Form submitted with result:", result);
    if (onClose) onClose();
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
        onChange={(key) => updateFormData({ llmApiKey: key })}
      />
      <AdvancedSettings
        config={formData.config}
        dbType={formData.dbType}
        onConfigChange={updateConfig}
        onOpenChange={setIsAdvancedOpen}
      />

      <div className="pt-2 text-right">
        <Button type="submit">Connect & Save</Button>
      </div>
    </form>
  );
};

export default ConfigureProjectForm;
