import { NextRequest, NextResponse } from "next/server";
import { getAgentInstance } from "@/services/agentManager";

export async function POST(req: NextRequest) {
  try {
    const { dbUrl } = await req.json();
    
    if (!dbUrl) {
      return NextResponse.json(
        { error: "Database URL is required" },
        { status: 400 }
      );
    }

    console.log('Getting agent instance for:', dbUrl);
    const agent = await getAgentInstance(dbUrl);
    
    console.log('Introspecting database...');
    const schema = await agent.introspect();
    
    if (!schema) {
      console.error('No schema returned from introspection');
      return NextResponse.json(
        { error: "Failed to get database schema" },
        { status: 500 }
      );
    }

    console.log('Schema retrieved successfully');
    return NextResponse.json({ schema });
  } catch (err: any) {
    console.error('Introspection error:', err);
    return NextResponse.json(
      { 
        error: err.message || "Failed to introspect database",
        details: err.stack
      },
      { status: 500 }
    );
  }
}