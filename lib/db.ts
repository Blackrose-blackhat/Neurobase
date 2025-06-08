// lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { encryptData, decryptData } from "./crypto";
import { SECRET_KEY } from "@/secret";

const DB_NAME = "dbgpt";
const DB_VERSION = 1;
const STORE_NAME = "projects";


export interface ProjectData {
  id: string;
  dbUrl: string;
  llmApiKey?: string;
  config: any;
  createdAt: string;
}

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: ProjectData;
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


export async function saveProject(project: ProjectData) {
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
