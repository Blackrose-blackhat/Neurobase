// app/api/debug/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { debugGetAgent, inspectCache } from "@/services/agentManager";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const testUrl = url.searchParams.get('dbUrl') || 'mongodb://localhost:27017/test';
    
    console.log('Debug endpoint called with dbUrl:', testUrl);

    // Test the getAgent function directly
    const getAgentResult = await debugGetAgent(testUrl);
    
    // Inspect current cache
    const cacheInfo = inspectCache();

    // Test different URL formats
    const urlTests = [
      'mongodb://localhost:27017/test',
      'mongodb+srv://user:pass@cluster.mongodb.net/db',
      'postgresql://user:pass@localhost:5432/db',
      'postgres://user:pass@localhost:5432/db',
      'mysql://user:pass@localhost:3306/db'
    ];

    const urlTestResults = [];
    for (const testDbUrl of urlTests) {
      try {
        const result = await debugGetAgent(testDbUrl);
        urlTestResults.push({
          url: testDbUrl.substring(0, 30) + '...',
          result
        });
      } catch (error) {
        urlTestResults.push({
          url: testDbUrl.substring(0, 30) + '...',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test import of getAgent function
    let importTest;
    try {
      const { getAgent } = await import("@/packages/agents");
      importTest = {
        success: true,
        type: typeof getAgent,
        isFunction: typeof getAgent === 'function'
      };
    } catch (importError) {
      importTest = {
        success: false,
        error: importError instanceof Error ? importError.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      testUrl,
      getAgentResult,
      cacheInfo,
      urlTestResults,
      importTest,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version
      }
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { dbUrl } = await req.json();
    
    if (!dbUrl) {
      return NextResponse.json(
        { error: 'dbUrl is required' },
        { status: 400 }
      );
    }

    console.log('Testing agent creation with provided dbUrl');
    
    // Test the full agent creation process
    try {
      const { getAgentInstance } = await import("@/services/agentManager");
      const agent = await getAgentInstance(dbUrl);
      
      return NextResponse.json({
        success: true,
        agent: {
          type: agent.constructor.name,
          methods: Object.getOwnPropertyNames(Object.getPrototypeOf(agent)),
          hasValidate: typeof agent.validate === 'function',
          hasExecute: typeof agent.execute === 'function',
          hasClose: typeof agent.close === 'function'
        }
      });
      
    } catch (agentError) {
      return NextResponse.json({
        success: false,
        error: agentError instanceof Error ? agentError.message : 'Unknown error',
        stack: agentError instanceof Error ? agentError.stack : undefined
      });
    }

  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}