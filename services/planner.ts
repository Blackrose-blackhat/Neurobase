// apps/server/src/services/planner.ts
import { generateMongoPlan } from '@/packages/agents/llm';
import { generatePostgresPlan } from '@/packages/agents/llm/generatePostgresPlan';

export async function generatePlan(agent: any, props: any) {
  if (agent.type === 'MongoAgent') {
    return generateMongoPlan(props);
  } else if (agent.type === 'PostgresAgent') {
    return generatePostgresPlan(props);
  } else {
    throw new Error('Unsupported agent type');
  }
}
