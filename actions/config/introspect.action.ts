import { getAgentInstance } from "@/services/agentManager";

export const introspectDB = async (dbUrl: string) => {
  const agent = await getAgentInstance(dbUrl);
  const schema = await agent.introspect();
  return schema;
};