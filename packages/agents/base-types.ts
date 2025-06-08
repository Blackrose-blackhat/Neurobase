// Shared types for all agents
export type FieldInfo = {
  type: string;
  nested?: Record<string, FieldInfo>;
  ref?: string;
};

export interface StructuredQueryPlan {
  operation: string;
  collection: string;
  filter?: Record<string, any>;
  projection?: Record<string, any>;
  options?: Record<string, any>;
  // DB-specific fields (e.g., aggregatePipeline, updateDoc, etc.)
  [key: string]: any;
}
