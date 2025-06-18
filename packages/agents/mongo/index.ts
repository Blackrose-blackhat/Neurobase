import { MongoClient, ObjectId } from "mongodb";
import { MongoStructredQueryPlan } from "./types";
import { generateMongoPlan } from "../llm/generatePlan";
import { Provider } from "../../types/modelType.type";

type FieldInfo = {
  type: string;
  nested?: Record<string, FieldInfo>;
  ref?: string;            // reference to another collection
};

function inferFieldType(value: any, key = ""): FieldInfo {
  if (value === null) return { type: "null" };

  // Detect ObjectId type & guess reference by key name (e.g. userId -> users)
  if (value && typeof value === "object" && value._bsontype === "ObjectID") {
    const fieldInfo: FieldInfo = { type: "ObjectId" };
    if (key.toLowerCase().endsWith("id")) {
      // simple heuristic: remove 'Id' and pluralize to guess collection
      const refName = key.slice(0, -2).toLowerCase();
      fieldInfo.ref = refName.endsWith('s') ? refName : refName + "s"; 
    }
    return fieldInfo;
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      nested: value[0] ? { "0": inferFieldType(value[0]) } : undefined,
    };
  }

  if (typeof value === "object") {
    const nested: Record<string, FieldInfo> = {};
    for (const k in value) {
      nested[k] = inferFieldType(value[k], k);
    }
    return { type: "object", nested };
  }

  return { type: typeof value };
}

export class MongoAgent {
  public readonly type = 'MongoAgent';
  client: MongoClient;
  dbName: string;

  constructor(dbUrl: string) {
    this.client = new MongoClient(dbUrl);
    this.dbName = new URL(dbUrl).pathname.substring(1);
  }

  async introspect() {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    const collections = await db.collections();

    const schema: Record<string, { fields: Record<string, FieldInfo> }> = {};

    for (const col of collections) {
      const idx = await col.indexes();
      const docs = await col.find({}).limit(10).toArray();

      const fields: Record<string, FieldInfo> = {};

      for (const doc of docs) {
        for (const key of Object.keys(doc)) {
          const value = doc[key];
          const inferred = inferFieldType(value, key);

          if (!fields[key]) {
            fields[key] = inferred;
          } else if (fields[key].type !== inferred.type) {
            fields[key].type = "mixed";
          }
          // If one has ref and the other doesn't, prefer the one with ref
          if (!fields[key].ref && inferred.ref) {
            fields[key].ref = inferred.ref;
          }
        }
      }

      schema[col.collectionName] = { fields };
    }

    await this.client.close();
    console.log("Introspected schema with refs:", JSON.stringify(schema, null, 2));
    return schema;
  }

  async generatePlan(
    userPrompt: string,
    provider: Provider = "openai",
    model: string = "gpt-3.5-turbo-instruct"
  ): Promise<MongoStructredQueryPlan> {
    const schema = await this.introspect();

    // Pass schema including refs to your LLM plan generator
    const plan = await generateMongoPlan({
      prompt: userPrompt,
      provider,
      model,
      schema,
      apiKey: process.env[provider === "openai" ? "OPENAI_API_KEY" : "GOOGLE_GENERATIVE_AI_API_KEY"],
    });

    return plan;
  }

  validate(plan: MongoStructredQueryPlan): boolean {
    if (!plan.operation || !plan.collection) return false;
    return true;
  }

  async execute(plan: MongoStructredQueryPlan): Promise<any> {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    const collection = db.collection(plan.collection);
    let res;

    switch (plan.operation) {
      case "show_database": {
        const collections = await db.collections();
        const databaseOverview = await Promise.all(collections.map(async (col) => {
          const count = await col.countDocuments();
          const sampleDoc = await col.findOne({});
          const fields = sampleDoc ? Object.keys(sampleDoc).filter(field => 
            field !== '_id' && 
            !field.includes('image') &&
            !field.includes('password') &&
            !field.includes('secret')
          ) : [];
          
          // Get field priorities for this collection
          const fieldPriorities = {
            high: ['name', 'title', 'email', 'username', 'type', 'status', 'createdAt', 'updatedAt'],
            medium: ['price', 'amount', 'quantity', 'category', 'tags', 'location'],
            low: ['description', 'notes', 'details']
          };

          // Select important fields
          const selectedFields = new Set<string>();
          
          // Add high priority fields
          for (const field of fieldPriorities.high) {
            if (fields.includes(field)) {
              selectedFields.add(field);
            }
          }

          // Add medium priority fields if needed
          if (selectedFields.size < 3) {
            for (const field of fieldPriorities.medium) {
              if (fields.includes(field) && selectedFields.size < 4) {
                selectedFields.add(field);
              }
            }
          }

          // Add low priority fields if still needed
          if (selectedFields.size < 3) {
            for (const field of fieldPriorities.low) {
              if (fields.includes(field) && selectedFields.size < 4) {
                selectedFields.add(field);
              }
            }
          }

          // If still no fields, take first 4
          if (selectedFields.size === 0) {
            fields.slice(0, 4).forEach(field => selectedFields.add(field));
          }

          // Get sample data with selected fields
          const sampleData = await col.find({}, {
            projection: Array.from(selectedFields).reduce((acc, field) => {
              acc[field] = 1;
              return acc;
            }, {} as Record<string, 1>),
            limit: 5
          }).toArray();

          return {
            collection: col.collectionName,
            documentCount: count,
            importantFields: Array.from(selectedFields),
            sampleData
          };
        }));

        res = {
          databaseName: this.dbName,
          collections: databaseOverview
        };
        break;
      }
      case "find": {
        let filter = plan.filter || {};
        // Iterate over each filter field
        filter = Object.entries(filter).reduce((acc, [key, value]) => {
          // For string values, replace with a regex matching anywhere (case-insensitive)
          if (typeof value === "string") {
            acc[key] = { $regex: value, $options: "i" };
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);

        // Handle projection correctly
        let projection = plan.projection || {};
        
        // If projection is empty, use smart field selection
        if (Object.keys(projection).length === 0) {
          // Get a sample document to analyze fields
          const sampleDoc = await collection.findOne({});
          if (sampleDoc) {
            // Define field priorities and exclusions
            const fieldPriorities = {
              // High priority fields (always include if present)
              high: ['name', 'title', 'email', 'username', 'type', 'status', 'createdAt', 'updatedAt'],
              // Medium priority fields (include if not too many high priority fields)
              medium: ['price', 'amount', 'quantity', 'category', 'tags', 'location'],
              // Low priority fields (include only if needed to fill up to 4-5 fields)
              low: ['description', 'notes', 'details']
            };

            // Get all fields from the document
            const allFields = Object.keys(sampleDoc).filter(field => 
              field !== '_id' && 
              !field.includes('image') &&
              !field.includes('password') &&
              !field.includes('secret')
            );

            // Select fields based on priority
            const selectedFields = new Set<string>();
            
            // First add high priority fields
            for (const field of fieldPriorities.high) {
              if (allFields.includes(field)) {
                selectedFields.add(field);
              }
            }

            // If we have less than 3 fields, add medium priority fields
            if (selectedFields.size < 3) {
              for (const field of fieldPriorities.medium) {
                if (allFields.includes(field) && selectedFields.size < 4) {
                  selectedFields.add(field);
                }
              }
            }

            // If we still have less than 3 fields, add low priority fields
            if (selectedFields.size < 3) {
              for (const field of fieldPriorities.low) {
                if (allFields.includes(field) && selectedFields.size < 4) {
                  selectedFields.add(field);
                }
              }
            }

            // If we still have no fields, add the first 4 non-excluded fields
            if (selectedFields.size === 0) {
              allFields.slice(0, 4).forEach(field => selectedFields.add(field));
            }

            // Create the projection
            projection = Array.from(selectedFields).reduce((acc, field) => {
              acc[field] = 1;
              return acc;
            }, {} as Record<string, 1>);
          }
        }

        res = await collection
          .find(filter, { projection, ...plan.options })
          .toArray();
        break;
      }
      case "aggregate":
        res = await collection
          .aggregate(plan.aggregatePipeline || [], plan.options)
          .toArray();
        break;
      case "insert":
        res = await collection.insertMany(plan.insertDoc || []);
        break;
      case "update":
        res = await collection.updateMany(
          plan.filter || {},
          plan.updateDoc || {},
          plan.options
        );
        break;
      case "delete":
        res = await collection.deleteMany(plan.filter || {}, plan.options);
        break;
      default:
        throw new Error("Unsupported operation");
    }

    await this.client.close();
    return res;
  }

  async close() {
    // Safely close the client if it's open
    try {
      await this.client.close();
    } catch (e) {
      // ignore errors on close
    }
  }
}
