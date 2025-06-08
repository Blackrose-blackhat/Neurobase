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
        res = await collection
          .find(filter, { projection: plan.projection, ...plan.options })
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
