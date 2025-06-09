// apps/server/src/services/agentManager.ts
import { getAgent } from "@/packages/agents";

const agentCache: Record<string, any> = {};

export async function getAgentInstance(dbUrl: string) {
  if (!agentCache[dbUrl]) {
    const AgentClass = await getAgent(dbUrl);
    if (!AgentClass) throw new Error('No suitable agent found');
    agentCache[dbUrl] = new AgentClass(dbUrl);
  }
  return agentCache[dbUrl];
}

export async function closeAgent(dbUrl: string) {
  const agent = agentCache[dbUrl];
  if (agent && typeof agent.close === 'function') {
    await agent.close();
    delete agentCache[dbUrl];
  } else {
    throw new Error('No agent found or unable to close connection');
  }
}
