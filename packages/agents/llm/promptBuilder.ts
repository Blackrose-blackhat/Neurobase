export function buildMongoPrompt(prompt: string, schema: Record<string, any>): string {
  const collections = Object.entries(schema)
    .map(([collection, { fields }]) => {
      const fieldList = Object.entries(fields)
        .map(([field, info]) => {
          let refInfo = "";
          if (
            typeof info === "object" &&
            info !== null &&
            (info as { type?: string }).type === "ObjectId" &&
            (info as { ref?: string }).ref
          ) {
            refInfo = ` (refers to ${(info as { ref: string }).ref})`;
          }
          return `${field}${refInfo}`;
        })
        .join(", ");
      return `- ${collection}: ${fieldList}`;
    })
    .join("\n");

  return `
You are an AI assistant that converts natural language into MongoDB structured query plans.

Available collections and their fields (with references):
${collections}

Important notes:
- Fields with type "ObjectId" and a "ref" property indicate references to other collections.
- To join referenced collections, use MongoDB aggregation stage "$lookup".
- Use "$lookup" only when the user query implies a relationship (e.g., "users who posted gigs").
- If no join is needed, use "find" operations.
- Always validate field and collection names exist in the schema.
- Do not hallucinate collections or fields.
- Output only valid JSON representing a query plan.

The query plan format:
{
  "operation": "find" | "aggregate" | "insert" | "update" | "delete",
  "collection": "string",
  "filter": { ... },
  "projection": { ... },
  "options": { ... },
  "aggregatePipeline": [ ... ],
  "insertDoc": [ ... ],
  "updateDoc": { ... }
}

User prompt: ${prompt}

Respond ONLY with the query plan JSON, no explanations.
`.trim();
}

export function buildPostgresPrompt(prompt: string, schema: Record<string, any>): string {
  const tables = Object.entries(schema)
    .map(([table, { fields }]) => {
      const fieldList = Object.entries(fields)
        .map(([field, info]) => `${field} (${(info as { type: string }).type})`)
        .join(", ");
      return `- ${table}: ${fieldList}`;
    })
    .join("\n");

  return `
You are an AI assistant that converts natural language into PostgreSQL structured query plans.

Available tables and their fields:
${tables}

Important notes:
- Always validate table and field names exist in the schema.
- Do not hallucinate tables or fields.
- Output only valid JSON representing a query plan.
- Use SQL WHERE syntax for filters (e.g., "id = 1 AND name = 'John'").
- For SELECT, specify "fields" as an array of field names.
- For INSERT/UPDATE, specify "values" as an object of field-value pairs.
- For DELETE/UPDATE, specify "where" as a SQL condition string.

The query plan format:
{
  "operation": "select" | "insert" | "update" | "delete",
  "table": "string",
  "fields": [ ... ],        // for select
  "values": { ... },        // for insert/update
  "where": "..."            // for select/update/delete
}

User prompt: ${prompt}

Respond ONLY with the query plan JSON, no explanations.
`.trim();
}