import { useCallback, useState } from "react";
import { FormData } from "@/types/dbConfig.types";

export const useFormData = () => {
  const [formData, setFormData] = useState<FormData>({
    name:"",
    dbType: "postgres",
    dbUrl: "",
    llmApiKey: "",
    config: {
      host: "",
      port: "",
      dbName: "",
      user: "",
      password: "",
    },
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateConfig = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name:"",
      dbType: "postgres",
      dbUrl: "",
      llmApiKey: "",
      config: {
        host: "",
        port: "",
        dbName: "",
        user: "",
        password: "",
      },
    });
    setIsAdvancedOpen(false);
  }, []);

  return {
    formData,
    isAdvancedOpen,
    setIsAdvancedOpen,
    updateFormData,
    updateConfig,
    resetForm,
  };
};