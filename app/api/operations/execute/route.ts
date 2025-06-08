import { NextRequest, NextResponse } from "next/server";
import { getAgentInstance } from "@/services/agentManager";
import { generatePlan } from "@/services/planner";

export async function POST(req: NextRequest) {
  try {
    const { prompt, dbUrl, provider, model, schema } = await req.json();
    const geminiApiKey = req.headers.get("x-gemini-api-key") as string | undefined;
    const openaiApiKey = req.headers.get("x-open-ai-api-key") as string | undefined;
    const apiKey = provider === "gemini" ? geminiApiKey : openaiApiKey;

    const agent = await getAgentInstance(dbUrl);
    // Pass schema directly, do NOT introspect in agent or planner
    const plan = await generatePlan(agent, { prompt, provider, model, schema, apiKey });
    if (!agent.validate(plan)) {
      return NextResponse.json({ error: "Invalid plan structure" }, { status: 400 });
    }
    const result = await agent.execute(plan);

    return NextResponse.json({
      plan,
      result,
      agentType: agent.constructor.name,
      query: plan.query || plan.sql || undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}