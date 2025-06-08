import { DatabaseDefaults,UrlPatterns } from "@/types/dbConfig.types";

export const DB_DEFAULTS: DatabaseDefaults = {
  postgres: { port: "5432", user: "postgres" },
  mongodb: { port: "27017" },
} as const;

export const URL_PATTERNS: UrlPatterns = {
  postgres: "postgres://user:pass@localhost:5432/mydb",
  mongodb: "mongodb://localhost:27017/mydb",
} as const;