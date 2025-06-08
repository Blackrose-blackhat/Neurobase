import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parsePostgresUrl = (url: string): Partial<DatabaseConfig> => {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol.startsWith("postgres")) {
      throw new Error("Invalid PostgreSQL URL");
    }
    
    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      dbName: parsedUrl.pathname.slice(1), // remove leading /
      user: parsedUrl.username,
      password: parsedUrl.password,
    };
  } catch (error) {
    console.warn("Failed to parse PostgreSQL URL:", error);
    return {};
  }
};

export const parseMongoUrl = (url: string): Partial<DatabaseConfig> => {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol.startsWith("mongodb")) {
      throw new Error("Invalid MongoDB URL");
    }
    
    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      dbName: parsedUrl.pathname.slice(1),
    };
  } catch (error) {
    console.warn("Failed to parse MongoDB URL:", error);
    return {};
  }
};

export const buildPostgresUrl = (config: DatabaseConfig): string => {
  const { host, port, dbName, user, password } = config;
  if (!host || !port || !dbName || !user) return "";
  
  const passSegment = password ? `:${password}` : "";
  return `postgres://${user}${passSegment}@${host}:${port}/${dbName}`;
};

export const buildMongoUrl = (config: DatabaseConfig): string => {
  const { host, port, dbName } = config;
  if (!host || !port || !dbName) return "";
  
  return `mongodb://${host}:${port}/${dbName}`;
};

export const parseUrlByType = (url: string, dbType: "postgres" | "mongodb"): Partial<DatabaseConfig> => {
  return dbType === "postgres" ? parsePostgresUrl(url) : parseMongoUrl(url);
};

export const buildUrlByType = (config: DatabaseConfig, dbType: "postgres" | "mongodb"): string => {
  return dbType === "postgres" ? buildPostgresUrl(config) : buildMongoUrl(config);
};

export function detectDbType(dbUrl: string): string {
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgresql';
  } else if (dbUrl.startsWith('mysql://')) {
    return 'mysql';
  } else if (dbUrl.startsWith('sqlite://')) {
    return 'sqlite';
  } else if (dbUrl.startsWith('mongodb://') || dbUrl.startsWith('mongodb+srv://')) {
    return 'mongodb';
  }
  return 'unknown';
} 