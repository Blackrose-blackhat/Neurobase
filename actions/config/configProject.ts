import { saveProject } from "@/lib/db";
import { FormData, ProjectData } from "@/types/dbConfig.types";

function generateUniqueId(): string {
  return crypto.randomUUID?.() || Date.now().toString();
}

async function introspectDatabase(dbUrl: string) {
  try {
    const response = await fetch('/api/operations/introspect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dbUrl })
    });

    const result = await response.json();
    console.log('Introspection result:', result);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.schema;
  } catch (error) {
    console.error('Failed to introspect database:', error);
    throw error;
  }
}

export async function handleConfigSubmit(
  e: React.FormEvent,
  formData: FormData,
  onSubmit?: (data: ProjectData) => void
) {
  e.preventDefault();
  
  try {
    // Validate required fields
    if (!formData.name || !formData.dbUrl || !formData.llmApiKey || !formData.provider || !formData.model) {
      throw new Error('Please fill in all required fields');
    }

    // First introspect the database
    const schema = await introspectDatabase(formData.dbUrl);

    // Save to IndexedDB with the schema
    const project = await saveProject({
      id: generateUniqueId(),
      name: formData.name,
      dbType: formData.dbType,
      dbUrl: formData.dbUrl,
      llmApiKey: formData.llmApiKey,
      provider: formData.provider,
      model: formData.model,
      schema: schema,
      config: formData.config || {},
      createdAt: new Date().toISOString()
    });

    if (onSubmit) {
      onSubmit(project);
    }

    return project;
  } catch (error) {
    console.error('Failed to save project:', error);
    throw error;
  }
}