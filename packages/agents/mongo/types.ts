export interface MongoStructredQueryPlan{
    operation:'find' | 'aggregate' | 'count' | 'insert' | 'update' | 'delete';
    collection: string;
    filter?: Record<string, any>;
    projection?: Record<string,1|0>;
    aggregatePipeline?:Array<Record<string, any>>;
    updateDoc?: Record<string,any>
    insertDoc?:Array<Record<string,any>>;
    options?:Record<string,any>;
}
