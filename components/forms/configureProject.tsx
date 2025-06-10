// components/forms/configureProject.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // shadcn input
import { useFormData } from "@/hooks/useFormData";
import { buildUrlByType, parseUrlByType } from "@/lib/utils";
import { AdvancedSettings } from "../configure/AdvancesSettings";
import { DatabaseTypeSelector } from "../configure/DatabaseTypeSelector";
import { DatabaseUrlInput } from "../configure/DatabaseUrlInput"; // This component should now handle its own icon/name display
import { LlmApiKeyInput } from "../configure/LlmApiKeyInput";
import { Loader2, CheckCircle2 } from "lucide-react";

import { FormData, ProjectData } from "@/types/dbConfig.types";
import { handleConfigSubmit } from "@/actions/config/configProject";
import { openDB } from "idb"; // Import openDB for IndexedDB access
import { cn } from "@/lib/utils"; // Import cn for conditional class names

// Debounce hook (can be moved to a separate file like '@/hooks/useDebounce.ts' if preferred)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ConfigureProjectFormProps {
  onSubmit?: (data: ProjectData) => void; // accepts ProjectData now
  initialData?: Partial<FormData>;
  onClose?: () => void; // optional close handler
}

export const ConfigureProjectForm: React.FC<ConfigureProjectFormProps> = ({
  onSubmit,
  initialData,
  onClose,
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
  const [projectNameError, setProjectNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);

  const debouncedProjectName = useDebounce(formData.name, 500); // Debounce project name input

  // Effect to check project name existence
  useEffect(() => {
    const checkProjectNameExists = async () => {
      if (!debouncedProjectName) { // Clear error if name is empty
        setProjectNameError(null);
        setIsCheckingName(false);
        return;
      }

      // If editing an existing project, and the name hasn't changed, no need to check
      if (initialData?.name && initialData.name === debouncedProjectName) {
        setProjectNameError(null);
        setIsCheckingName(false);
        return;
      }

      setIsCheckingName(true);
      try {
        const db = await openDB("dbgpt", 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains("projects")) {
              db.createObjectStore("projects", { keyPath: "id" });
            }
          },
        });

        const tx = db.transaction("projects", "readonly");
        const store = tx.objectStore("projects");
        
        const allProjects = await store.getAll();
    
       
        const existingProject = allProjects.find(
          (project: ProjectData) => project.name === debouncedProjectName
        );

        if (existingProject) {
          setProjectNameError("A project with this name already exists.");
        } else {
          setProjectNameError(null);
        }
      } catch (err) {
        console.error("Error checking project name:", err);
        setProjectNameError("Could not check project name. Please try again.");
      } finally {
        setIsCheckingName(false);
      }
    };

    checkProjectNameExists();
  }, [debouncedProjectName, initialData?.name]);

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
    setProjectNameError(null);

    if (isCheckingName) {
      setError("Please wait, checking project name existence...");
      setIsLoading(false);
      return;
    }

    if (projectNameError) {
      setIsLoading(false);
      return;
    }
    
    try {
      await handleConfigSubmit(e, formData, onSubmit);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || isCheckingName || !!projectNameError || !formData.name || !formData.dbUrl;

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
          className={cn(
            projectNameError && "border-destructive focus-visible:ring-destructive",
            isCheckingName && "border-blue-500 focus-visible:ring-blue-500",
            (!projectNameError && !isCheckingName && debouncedProjectName) && "border-green-500 focus-visible:ring-green-500" // Green border for available name
          )}
        />
        <div className="text-sm mt-1 flex items-center">
          {isCheckingName ? (
            <p className="text-blue-500 flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking project name...
            </p>
          ) : projectNameError ? (
            <p className="text-destructive flex items-center gap-1">
              <span className="font-semibold">Error:</span> {projectNameError}
            </p>
          ) : (debouncedProjectName && !error) && ( // Show available only if name is debounced and no general form error
            <p className="text-green-500 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Available
            </p>
          )}
          {error && <p className="text-destructive ml-2">{error}</p>} {/* Display general form error if any */}
        </div>
      </div>

      <DatabaseTypeSelector
        value={formData.dbType}
        onChange={handleDbTypeChange}
      />

      {/* Database URL Input - now includes database type/icon display */}
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
        <Button type="submit" disabled={isSubmitDisabled}>
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