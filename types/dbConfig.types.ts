export interface ConfigFields {
  host: string;
  port: string;
  dbName: string;
  user: string;
  password: string;
}

export interface FormData {
  name: string;
  dbType: "postgres" | "mongodb";
  dbUrl: string;
  llmApiKey: string;
  provider: string;
  model: string;
  config: ConfigFields;
}

export interface ProjectData extends FormData {
  id: string;
  createdAt: string;
  schema?: {
    tables: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: string;
        nested?: any;
        ref?: string;
      }>;
    }>;
  };
}
