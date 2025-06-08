import { NextRequest, NextResponse } from "next/server";
import { getAgentInstance } from "@/services/agentManager";
import { generatePlan } from "@/services/planner";
import { Message } from '@/types/chat';
import { MongoStructredQueryPlan } from '@/packages/agents/mongo/types';
import { PostgresStructuredQueryPlan } from '@/packages/agents/llm/generatePostgresPlan';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      dbUrl,
      provider,
      model,
      schema,
      context = [],
    } = await req.json();

    const geminiApiKey = req.headers.get("x-gemini-api-key") as string | undefined;
    const openaiApiKey = req.headers.get("x-open-ai-api-key") as string | undefined;
    const apiKey = provider === "gemini" ? geminiApiKey : openaiApiKey;

    // Get the agent instance
    const agent = await getAgentInstance(dbUrl);

    // Generate plan with context
    const plan = await generatePlan(agent, {
      prompt,
      provider,
      model,
      schema,
      apiKey,
      context, // Pass context to the plan generator
    });

    if (!agent.validate(plan)) {
      return NextResponse.json({ error: "Invalid plan structure" }, { status: 400 });
    }

    // Execute the plan
    const result = await agent.execute(plan);

    // Get the appropriate query representation based on agent type
    let query;
    if (agent.constructor.name === 'MongoAgent') {
      const mongoPlan = plan as MongoStructredQueryPlan;
      query = mongoPlan.operation === 'find' ? mongoPlan.filter : mongoPlan.aggregatePipeline;
    } else if (agent.constructor.name === 'PostgresAgent') {
      const postgresPlan = plan as PostgresStructuredQueryPlan;
      query = postgresPlan.operation === 'select' ? postgresPlan.where : postgresPlan.fields;
    }

    return NextResponse.json({
      result,
      agentType: agent.constructor.name,
      query,
    });
  } catch (err: any) {
    console.error('Error executing operation:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to execute operation' },
      { status: 500 }
    );
  }
}