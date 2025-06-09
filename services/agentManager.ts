// apps/server/src/services/agentManager.ts
import { getAgent } from "@/packages/agents";

const agentCache: Record<string, any> = {};

// Add agent type detection that works with minified code
function getAgentType(agent: any): string {
  // Method 1: Check for agent-specific properties/methods
  if (agent.collection || agent.db || (agent.client && agent.client.topology)) {
    return 'MongoAgent';
  }
  if (agent.pool || agent.query || (agent.client && agent.client.database)) {
    return 'PostgresAgent';
  }
  if (agent.connection || (agent.client && agent.client.config && agent.client.config.host)) {
    return 'MySQLAgent';
  }
  
  // Method 2: Check constructor name if not minified
  const constructorName = agent.constructor.name;
  if (constructorName && constructorName !== 'u' && constructorName !== 'Object') {
    return constructorName;
  }
  
  // Method 3: Check agent's own type property if available
  if (agent.type) {
    return agent.type;
  }
  
  // Method 4: Check prototype chain
  const prototype = Object.getPrototypeOf(agent);
  if (prototype && prototype.constructor && prototype.constructor.name !== 'u') {
    return prototype.constructor.name;
  }
  
  // Fallback
  return 'UnknownAgent';
}

export async function getAgentInstance(dbUrl: string) {
  try {
    console.log('getAgentInstance called with dbUrl:', dbUrl ? `${dbUrl.substring(0, 20)}...` : 'undefined');

    if (!dbUrl || typeof dbUrl !== 'string') {
      console.error('Invalid dbUrl provided:', { dbUrl, type: typeof dbUrl });
      throw new Error('Invalid database URL provided');
    }

    // Check cache first
    if (agentCache[dbUrl]) {
      console.log('Returning cached agent for dbUrl');
      return agentCache[dbUrl];
    }

    console.log('Getting agent class from getAgent function...');
    let AgentClass;
    
    try {
      AgentClass = await getAgent(dbUrl);
      console.log('getAgent returned:', {
        hasAgentClass: !!AgentClass,
        agentType: AgentClass?.name || 'unknown',
        isFunction: typeof AgentClass === 'function'
      });
    } catch (getAgentError) {
      console.error('Error in getAgent function:', {
        error: getAgentError instanceof Error ? getAgentError.message : 'Unknown error',
        stack: getAgentError instanceof Error ? getAgentError.stack : undefined,
        dbUrl: dbUrl ? `${dbUrl.substring(0, 20)}...` : 'undefined'
      });
      throw new Error(`Failed to get agent class: ${getAgentError instanceof Error ? getAgentError.message : 'Unknown error'}`);
    }

    if (!AgentClass) {
      console.error('No agent class returned from getAgent');
      throw new Error('No suitable agent found for the provided database URL');
    }

    if (typeof AgentClass !== 'function') {
      console.error('AgentClass is not a constructor function:', typeof AgentClass);
      throw new Error('Invalid agent class returned');
    }

    console.log('Creating new agent instance...');
    let agentInstance;
    
    try {
      agentInstance = new AgentClass(dbUrl);
      
      // Set agent type explicitly to avoid minification issues
      const detectedType = getAgentType(agentInstance);
      agentInstance._agentType = detectedType;
      
      console.log('Agent instance created successfully:', {
        type: detectedType,
        originalConstructorName: agentInstance.constructor.name,
        hasValidate: typeof agentInstance.validate === 'function',
        hasExecute: typeof agentInstance.execute === 'function',
        hasClose: typeof agentInstance.close === 'function'
      });
    } catch (constructorError) {
      console.error('Error creating agent instance:', {
        error: constructorError instanceof Error ? constructorError.message : 'Unknown error',
        stack: constructorError instanceof Error ? constructorError.stack : undefined,
        agentClassName: AgentClass?.name || 'unknown'
      });
      throw new Error(`Failed to create agent instance: ${constructorError instanceof Error ? constructorError.message : 'Unknown error'}`);
    }

    // Validate that the agent has required methods
    const requiredMethods = ['validate', 'execute'];
    const missingMethods = requiredMethods.filter(method => typeof agentInstance[method] !== 'function');
    
    if (missingMethods.length > 0) {
      console.error('Agent instance missing required methods:', {
        missing: missingMethods,
        available: Object.getOwnPropertyNames(Object.getPrototypeOf(agentInstance))
      });
      throw new Error(`Agent missing required methods: ${missingMethods.join(', ')}`);
    }

    // Cache the instance
    agentCache[dbUrl] = agentInstance;
    console.log('Agent cached successfully');

    return agentInstance;

  } catch (error) {
    console.error('Error in getAgentInstance:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function closeAgent(dbUrl: string) {
  try {
    console.log('closeAgent called for dbUrl:', dbUrl ? `${dbUrl.substring(0, 20)}...` : 'undefined');
    
    const agent = agentCache[dbUrl];
    
    if (!agent) {
      console.warn('No agent found in cache for dbUrl');
      throw new Error('No agent found in cache');
    }

    if (typeof agent.close === 'function') {
      console.log('Closing agent connection...');
      await agent.close();
      console.log('Agent connection closed successfully');
    } else {
      console.warn('Agent does not have close method');
    }

    delete agentCache[dbUrl];
    console.log('Agent removed from cache');

  } catch (error) {
    console.error('Error in closeAgent:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Unable to close agent connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced debug function
export async function debugGetAgent(dbUrl: string) {
  try {
    console.log('Testing getAgent function with dbUrl:', dbUrl);
    
    // Test URL parsing
    let parsedUrl;
    try {
      parsedUrl = new URL(dbUrl);
      console.log('URL parsed successfully:', {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: parsedUrl.pathname
      });
    } catch (urlError) {
      console.error('URL parsing failed:', urlError);
      return { error: 'Invalid URL format', details: urlError };
    }

    // Test the getAgent function
    try {
      const result = await getAgent(dbUrl);
      return {
        success: true,
        result: {
          hasResult: !!result,
          type: typeof result,
          name: result?.name || 'unknown',
          isFunction: typeof result === 'function'
        }
      };
    } catch (getAgentError) {
      return {
        success: false,
        error: getAgentError instanceof Error ? getAgentError.message : 'Unknown error',
        stack: getAgentError instanceof Error ? getAgentError.stack : undefined
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Add function to inspect cache
export function inspectCache() {
  return {
    cacheKeys: Object.keys(agentCache),
    cacheSize: Object.keys(agentCache).length,
    agents: Object.keys(agentCache).map(key => ({
      key: key.substring(0, 20) + '...',
      type: getAgentType(agentCache[key]),
      originalConstructorName: agentCache[key]?.constructor?.name || 'unknown'
    }))
  };
}