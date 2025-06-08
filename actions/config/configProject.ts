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
  e: React.FormEvent<HTMLFormElement>,
  formData: FormData,
  onSubmit?: (data: ProjectData) => void
): Promise<void> {
  e.preventDefault();

  try {
    // First introspect the database
    const schema = await introspectDatabase(formData.dbUrl);
    console.log('Schema:', schema);
    const projectData: ProjectData = {
      id: generateUniqueId(),
      createdAt: new Date().toISOString(),
      ...formData,
      schema // Add the schema to the project data
    };

    await saveProject(projectData);
    console.log("Project saved with id:", projectData.id);
    onSubmit?.(projectData);
  } catch (error) {
    console.error("Failed to save project:", error);
    throw error;
  }
}