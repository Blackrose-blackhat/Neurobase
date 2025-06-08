export function getAgent(dbUrl: string) {
    if (dbUrl.startsWith('mongodb://') || dbUrl.startsWith('mongodb+srv://')) {
        return import('./mongo/index').then(m => m.MongoAgent);
    }
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
        return import('./postgres').then(m => m.PostgresAgent);
    }
}