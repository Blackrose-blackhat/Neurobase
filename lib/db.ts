// lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { encryptData, decryptData } from "./crypto";
import { SECRET_KEY } from "@/secret";

const DB_NAME = "dbgpt";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const CHAT_STORE_NAME = "chats";

let dbConnection: IDBDatabase | null = null;
let isConnecting = false;
let connectionPromise: Promise<IDBDatabase> | null = null;

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

async function getDatabase(): Promise<IDBDatabase> {
  if (dbConnection && dbConnection.readyState === 'open') {
    return dbConnection;
  }

  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  connectionPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      isConnecting = false;
      connectionPromise = null;
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      dbConnection = db;
      isConnecting = false;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
        db.createObjectStore(CHAT_STORE_NAME);
      }
    };
  });

  return connectionPromise;
}

export async function ensureDatabaseReady(): Promise<void> {
  try {
    await getDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (error instanceof Error && error.message.includes('database connection is closing')) {
        dbConnection = null;
        connectionPromise = null;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

export async function isProjectNameExists(name: string, currentProjectId?: string): Promise<boolean> {
  const db = await getDatabase();
  const allProjects = await new Promise<ProjectData[]>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get all projects'));
  });
  return allProjects.some(project => 
    project.name === name && project.id !== currentProjectId
  );
}

export async function saveProject(project: ProjectData, skipNameCheck: boolean = false) {
  if (!skipNameCheck) {
    const nameExists = await isProjectNameExists(project.name, project.id);
    if (nameExists) {
      throw new Error(`A project with name "${project.name}" already exists`);
    }
  }

  const encryptedProject = {
    ...project,
    dbUrl: await encryptData(SECRET_KEY, project.dbUrl),
    llmApiKey: project.llmApiKey
      ? await encryptData(SECRET_KEY, project.llmApiKey)
      : undefined,
  };

  return withRetry(async () => {
    const db = await getDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.put(encryptedProject);
  });
}

export async function getProject(id: string): Promise<ProjectData | undefined> {
  return withRetry(async () => {
    const db = await getDatabase();
    const encryptedProject = await new Promise<ProjectData | undefined>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || undefined);
      request.onerror = () => reject(new Error('Failed to get project'));
    });

    if (!encryptedProject) return undefined;

    return {
      ...encryptedProject,
      dbUrl: await decryptData(SECRET_KEY, encryptedProject.dbUrl),
      llmApiKey: encryptedProject.llmApiKey
        ? await decryptData(SECRET_KEY, encryptedProject.llmApiKey)
        : undefined,
    };
  });
}

export async function saveChat(projectId: string, messages: any[]) {
  return withRetry(async () => {
    const db = await getDatabase();
    const transaction = db.transaction([CHAT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CHAT_STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.put(messages, projectId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save chat'));
    });
  });
}

export async function getChat(projectId: string) {
  return withRetry(async () => {
    const db = await getDatabase();
    return await new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction([CHAT_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CHAT_STORE_NAME);
      const request = store.get(projectId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get chat'));
    });
  });
}

export async function saveChatHistory(projectId: string, messages: any[]) {
  const project = await getProject(projectId);
  
  if (project) {
    project.chatHistory = { messages };
    await saveProject(project, true);
  }
}

export async function getChatHistory(projectId: string) {
  const project = await getProject(projectId);
  return project?.chatHistory?.messages || [];
}

export async function executeQuery(dbUrl: string, query: string): Promise<any> {
  return [
    { table_name: 'users', table_schema: 'public' },
    { table_name: 'products', table_schema: 'public' },
  ];
}

export function closeDatabase(): void {
  if (dbConnection) {
    dbConnection.close();
    dbConnection = null;
    connectionPromise = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    closeDatabase();
  });
}
