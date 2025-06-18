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
  "operation": "find" | "aggregate" | "insert" | "update" | "delete" | "show_database",
  "collection": "string",
  "filter": { ... },
  "projection": { field1: 1, field2: 1 },
  "options": { ... },
  "aggregatePipeline": [ ... ],
  "insertDoc": [ ... ],
  "updateDoc": { ... }
}

User prompt: ${prompt}
important : Take a good look at all the schema fields when a query appears to show all the data of a 
praticular table or collection show only meaningful data like to get all users query probably show only 
name email and other only 3-4 fields depening upon your priority. For projections:

When user asks to "show whole database" or "show all collections":
- Set operation to "show_database"
- Set collection to any collection name (it will be ignored)
- Do not set any other fields

When user asks to "show all" or "show whole table" for a specific collection:
- Set operation to "find"
- Set filter to {} (empty object to get all documents)
- Set projection to {} (empty object to let the system handle field selection)
- Do not specify any fields in projection

For other queries:
- Use inclusion projection (field: 1) to explicitly specify which fields to include
- Do not mix inclusion and exclusion in the same projection
- Do not include _id in the projection unless specifically requested
- Do not show fields with large text like description or bio
- Do not show images

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
- For SELECT queries:
  - Be precise and selective with field selection
  - When user asks to "show all users" or similar general queries:
    - Select only 2-3 most important identifying fields (e.g., id and name/username)
    - DO NOT use SELECT * or include all fields
    - Exclude sensitive fields, large text fields, and binary data
  - Only include additional fields if specifically requested by the user
  - If user asks for specific fields, include only those fields
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