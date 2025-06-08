// lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { encryptData, decryptData } from "./crypto";
import { SECRET_KEY } from "@/secret";

const DB_NAME = "dbgpt";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const CHAT_STORE_NAME = "chats";


export interface ProjectData {
  id: string;
  dbUrl: string;
  llmApiKey?: string;
  config: any;
  createdAt: string;
  name: string;
  dbType: string;
  schema?: any;
  model: string;
  provider: string;
  chatHistory?: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      data?: any;
      query?: string;
      timestamp: number;
    }>;
  };
}

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: ProjectData;
  };
  [CHAT_STORE_NAME]: {
    key: string;
    value: any[];
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
          db.createObjectStore(CHAT_STORE_NAME);
        }
      },
    });
  }
  try {
    return await dbPromise;
  } catch (e) {
    // If the connection is closing or closed, reset and retry once
    dbPromise = null;
    return getDB();
  }
}

// Add this new function to check for duplicate names
export async function isProjectNameExists(name: string, currentProjectId?: string): Promise<boolean> {
  const db = await getDB();
  const allProjects = await db.getAll(STORE_NAME);
  return allProjects.some(project => 
    project.name === name && project.id !== currentProjectId
  );
}

// Modify the saveProject function to include name validation
export async function saveProject(project: ProjectData, skipNameCheck: boolean = false) {
  if (!skipNameCheck) {
    const nameExists = await isProjectNameExists(project.name, project.id);
    if (nameExists) {
      throw new Error(`A project with name "${project.name}" already exists`);
    }
  }

  // Encrypt sensitive fields
  const encryptedProject = {
    ...project,
    dbUrl: await encryptData(SECRET_KEY, project.dbUrl),
    llmApiKey: project.llmApiKey
      ? await encryptData(SECRET_KEY, project.llmApiKey)
      : undefined,
  };

  const db = await getDB();
  await db.put(STORE_NAME, encryptedProject);
}

export async function getProject(id: string): Promise<ProjectData | undefined> {
  const db = await getDB();
  const encryptedProject = await db.get(STORE_NAME, id);
  if (!encryptedProject) return undefined;

  return {
    ...encryptedProject,
    dbUrl: await decryptData(SECRET_KEY, encryptedProject.dbUrl),
    llmApiKey: encryptedProject.llmApiKey
      ? await decryptData(SECRET_KEY, encryptedProject.llmApiKey)
      : undefined,
  };
}

export async function saveChat(projectId: string, messages: any[]) {
  const db = await getDB();
  await db.put(CHAT_STORE_NAME, messages, projectId);
}

export async function getChat(projectId: string) {
  const db = await getDB();
  return await db.get(CHAT_STORE_NAME, projectId);
}

export async function saveChatHistory(projectId: string, messages: any[]) {
  const db = await getDB();
  const project = await db.get(STORE_NAME, projectId);
  
  if (project) {
    project.chatHistory = { messages };
    await saveProject(project, true); // Skip name check when updating
  }
}

export async function getChatHistory(projectId: string) {
  const db = await getDB();
  const project = await db.get(STORE_NAME, projectId);
  return project?.chatHistory?.messages || [];
}

export async function executeQuery(dbUrl: string, query: string): Promise<any> {
  // TODO: Implement actual database query execution
  // For now, return mock data
  return [
    { table_name: 'users', table_schema: 'public' },
    { table_name: 'products', table_schema: 'public' },
  ];
}
