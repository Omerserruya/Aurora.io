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
    // Register data adapters - order matters for evaluation priority
    this.registerAdapter(new FeedbackAdapter()); // Highest priority for feedback handling
    this.registerAdapter(new WelcomeAdapter()); // New users
    this.registerAdapter(new HelpAdapter()); // Help requests
    this.registerAdapter(new ImprovementAdapter()); // Improvement and optimization advice
    this.registerAdapter(new TroubleshootingAdapter()); // Troubleshooting issues
    this.registerAdapter(new GeneralPromptAdapter()); // General greetings
    this.registerAdapter(new CloudDataAdapter()); // Technical queries
    
    logger.info(`ContextService initialized with ${this.adapters.length} data adapters`);
  }
  
  private registerAdapter(adapter: IDataAdapter): void {
    this.adapters.push(adapter);
    logger.info(`Registered data adapter: ${adapter.name}`);
  }
  
  public async getContext(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Getting context for user ${userId}, connection ${connectionId} with query: ${query.substring(0, 50)}...`);
    
    // Find adapters that can handle this query
    const relevantAdapters = this.adapters.filter(adapter => 
      adapter.supportsQuery(query)
    );
    
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
    
    // Get data from all relevant adapters
    const contextPromises = relevantAdapters.map(adapter => 
      adapter.getContextData(userId, query, connectionId)
    );
    
    try {
      const contexts = await Promise.all(contextPromises);
      
      // Filter out errors
      const validContexts = contexts.filter(ctx => !ctx.error);
      
      if (validContexts.length === 0) {
        // All adapters returned errors
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
      
      // Combine contexts from different sources
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