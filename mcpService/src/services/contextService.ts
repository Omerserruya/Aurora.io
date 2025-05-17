import { IDataAdapter, ContextData } from '../interfaces/IDataAdapter';
import CloudDataAdapter from './data/cloudDataAdapter';
import GeneralPromptAdapter from './data/generalPromptAdapter';
import WelcomeAdapter from './data/welcomeAdapter';
import HelpAdapter from './data/helpAdapter';
import FeedbackAdapter from './data/feedbackAdapter';
import ImprovementAdapter from './data/improvementAdapter';
import TroubleshootingAdapter from './data/troubleshootingAdapter';
import logger from '../utils/logger';

class ContextService {
  private adapters: IDataAdapter[] = [];
  
  constructor() {
    // ================= ADAPTER REGISTRATION ORDER RATIONALE =================
    // The order of adapter registration is critical as it determines evaluation priority.
    // Adapters are evaluated in the order they are registered:
    
    // 1. FeedbackAdapter - Highest priority
    // Immediately captures user appreciation or complaints, ensuring we always
    // acknowledge the user's sentiment before any other processing.
    this.registerAdapter(new FeedbackAdapter());
    
    // 2. WelcomeAdapter - New user onboarding
    // Must come early to ensure first-time users get appropriate introduction
    // before any technical responses.
    this.registerAdapter(new WelcomeAdapter());
    
    // 3. HelpAdapter - Direct assistance requests
    // Prioritized to handle explicit requests for help or guidance,
    // ensuring users can always get assistance when specifically asked for.
    this.registerAdapter(new HelpAdapter());
    
    // 4. ImprovementAdapter - Targeted recommendations
    // Handles requests for advice on improving AWS environment,
    // comes before troubleshooting since improvements are usually proactive.
    this.registerAdapter(new ImprovementAdapter());
    
    // 5. TroubleshootingAdapter - Problem solving
    // For handling specific issues or errors the user is experiencing,
    // giving specific steps rather than general info.
    this.registerAdapter(new TroubleshootingAdapter());
    
    // 6. GeneralPromptAdapter - Generic greetings
    // Lower priority as it handles general conversation starters
    // that don't fit specialized categories above.
    this.registerAdapter(new GeneralPromptAdapter());
    
    // 7. CloudDataAdapter - Technical AWS queries
    // Lowest priority, only triggered when the query contains technical AWS terms.
    // This is our fallback for specific cloud-related technical inquiries.
    this.registerAdapter(new CloudDataAdapter());
    
    logger.info(`ContextService initialized with ${this.adapters.length} data adapters`);
  }
  
  private registerAdapter(adapter: IDataAdapter): void {
    this.adapters.push(adapter);
    logger.info(`Registered data adapter: ${adapter.name}`);
  }
  
  public async getContext(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Getting context for user ${userId}, connection ${connectionId} with query: ${query.substring(0, 50)}...`);
    
    // ========== ADAPTER SELECTION LOGIC ==========
    // This crucial step determines which adapters are relevant for this query
    // by checking if each adapter's supportsQuery() method returns true.
    // The order matters - we check adapters in the priority order established in the constructor.
    const relevantAdapters = this.adapters.filter(adapter => 
      adapter.supportsQuery(query)
    );
    
    // If no adapters matched this query, provide a helpful, user-friendly response
    // instead of the generic "no data" message
    if (relevantAdapters.length === 0) {
      logger.warn(`No relevant data adapters found for query`);
      return {
        text: "",
        metadata: {
          source: "none",
          timestamp: new Date().toISOString(),
          reliability: 0
        },
        error: "I'm not sure how to help with that query. I'm specialized in AWS cloud architecture and infrastructure. Could you try asking about your AWS resources, security setup, or cloud infrastructure?"
      };
    }
    
    // ========== CONTEXT GATHERING ==========
    // For each relevant adapter, get context data that will guide the AI's response
    // This could be from databases, cloud resources, or predefined templates
    const contextPromises = relevantAdapters.map(adapter => 
      adapter.getContextData(userId, query, connectionId)
    );
    
    try {
      // Wait for all adapters to return their context data
      const contexts = await Promise.all(contextPromises);
      
      // Filter out contexts that returned errors
      const validContexts = contexts.filter(ctx => !ctx.error);
      
      // If all adapters encountered errors, return a combined error message
      if (validContexts.length === 0) {
        const errors = contexts.map(ctx => ctx.error).filter(Boolean).join("; ");
        return {
          text: "",
          metadata: {
            source: "error",
            timestamp: new Date().toISOString(),
            reliability: 0
          },
          error: `Failed to retrieve context data: ${errors}`
        };
      }
      
      // ========== CONTEXT COMBINING ==========
      // Merge valid contexts from all adapters to create a comprehensive
      // knowledge base for the AI to generate its response
      const combinedText = validContexts.map(ctx => ctx.text).join("\n\n");
      const sources = validContexts.map(ctx => ctx.metadata.source).join(", ");
      
      return {
        text: combinedText,
        metadata: {
          source: sources,
          timestamp: new Date().toISOString(),
          reliability: 0.8
        }
      };
    } catch (error: any) {
      logger.error(`Error retrieving context: ${error.message}`);
      return {
        text: "",
        metadata: {
          source: "error",
          timestamp: new Date().toISOString(),
          reliability: 0
        },
        error: `Context retrieval error: ${error.message}`
      };
    }
  }
}

export default new ContextService(); 