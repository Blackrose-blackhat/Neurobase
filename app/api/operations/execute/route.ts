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

    // Add debugging logs
    console.log('Request payload:', {
      prompt: prompt ? `${prompt.substring(0, 100)}...` : 'undefined',
      dbUrl: dbUrl ? `${dbUrl.substring(0, 20)}...` : 'undefined',
      provider,
      model,
      hasSchema: !!schema,
      contextLength: context.length
    });

    // Get API keys from headers
    const geminiApiKey = req.headers.get("x-gemini-api-key");
    const openaiApiKey = req.headers.get("x-open-ai-api-key");
    const apiKey = provider === "gemini" ? geminiApiKey : openaiApiKey;

    if (!apiKey) {
      console.error(`Missing API key for provider: ${provider}`);
      return NextResponse.json(
        { error: `Missing API key for provider: ${provider}` },
        { status: 400 }
      );
    }

    if (!dbUrl) {
      console.error('Missing database URL');
      return NextResponse.json(
        { error: "Missing database URL" },
        { status: 400 }
      );
    }

    // Enhanced debugging for agent creation
    console.log('Attempting to get agent instance for dbUrl:', dbUrl);
    
    // Get the agent instance based on database type
    let agent;
    try {
      agent = await getAgentInstance(dbUrl);
      console.log('Agent instance created:', {
        agentType: agent?.constructor?.name || 'unknown',
        hasAgent: !!agent
      });
    } catch (agentError) {
      console.error('Error creating agent instance:', agentError);
      return NextResponse.json(
        { 
          error: "Failed to initialize database agent",
          details: agentError instanceof Error ? agentError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (!agent) {
      console.error('Agent instance is null/undefined');
      return NextResponse.json(
        { error: "Failed to initialize database agent - agent is null" },
        { status: 500 }
      );
    }

    // Generate plan with context
    console.log('Generating plan...');
    let plan;
    try {
      plan = await generatePlan(agent, {
        prompt,
        provider,
        model,
        schema,
        apiKey,
        context,
      });
      console.log('Plan generated successfully:', {
        planType: typeof plan,
        hasValidate: typeof agent.validate === 'function',
        hasExecute: typeof agent.execute === 'function'
      });
    } catch (planError) {
      console.error('Error generating plan:', planError);
      return NextResponse.json(
        { 
          error: "Failed to generate plan",
          details: planError instanceof Error ? planError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Validate plan
    if (typeof agent.validate !== 'function') {
      console.error('Agent does not have validate method');
      return NextResponse.json(
        { error: "Agent missing validate method" },
        { status: 500 }
      );
    }

    if (!agent.validate(plan)) {
      console.error('Plan validation failed');
      return NextResponse.json(
        { error: "Invalid plan structure" },
        { status: 400 }
      );
    }

    // Execute the plan
    console.log('Executing plan...');
    let result;
    try {
      if (typeof agent.execute !== 'function') {
        console.error('Agent does not have execute method');
        return NextResponse.json(
          { error: "Agent missing execute method" },
          { status: 500 }
        );
      }

      result = await agent.execute(plan);
      console.log('Plan executed successfully, result type:', typeof result);
    } catch (executeError) {
      console.error('Error executing plan:', executeError);
      return NextResponse.json(
        { 
          error: "Failed to execute plan",
          details: executeError instanceof Error ? executeError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Get the appropriate query representation based on agent type
    let query;
    // Use the reliable agent type detection
    const agentTypeName = agent._agentType || agent.constructor.name;
    console.log('Agent type name:', agentTypeName, 'Original constructor:', agent.constructor.name);
    console.log('Plan structure:', {
      planType: typeof plan,
      planKeys: plan ? Object.keys(plan) : 'null',
      hasOperation: plan && 'operation' in plan
    });

    if (agentTypeName === 'MongoAgent' || agentTypeName.includes('Mongo')) {
      console.log('Processing MongoAgent query extraction...');
      const mongoPlan = plan as MongoStructredQueryPlan;
      console.log('Mongo plan operation:', mongoPlan?.operation);
      query = mongoPlan.operation === 'find' ? mongoPlan.filter : mongoPlan.aggregatePipeline;
      console.log('Extracted mongo query:', query);
    } else if (agentTypeName === 'PostgresAgent' || agentTypeName.includes('Postgres')) {
      console.log('Processing PostgresAgent query extraction...');
      const postgresPlan = plan as PostgresStructuredQueryPlan;
      console.log('Postgres plan operation:', postgresPlan?.operation);
      query = postgresPlan.operation === 'select' ? postgresPlan.where : postgresPlan.fields;
      console.log('Extracted postgres query:', query);
    } else {
      console.warn('Unknown agent type for query extraction:', agentTypeName);
      // Fallback: try to detect by plan structure
      if (plan && 'filter' in plan) {
        console.log('Detected MongoDB plan structure');
        const mongoPlan = plan as MongoStructredQueryPlan;
        query = mongoPlan.operation === 'find' ? mongoPlan.filter : mongoPlan.aggregatePipeline;
      } else if (plan && 'where' in plan) {
        console.log('Detected PostgreSQL plan structure');
        const postgresPlan = plan as PostgresStructuredQueryPlan;
        query = postgresPlan.operation === 'select' ? postgresPlan.where : postgresPlan.fields;
      } else {
        query = null;
      }
    }

    return NextResponse.json({
      result,
      agentType: agentTypeName,
      query,
    });
  } catch (err: any) {
    console.error('Unexpected error in API endpoint:', err);
    return NextResponse.json(
      { 
        error: err.message || 'Failed to execute operation',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}