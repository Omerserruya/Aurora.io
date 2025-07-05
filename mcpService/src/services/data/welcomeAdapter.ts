import { IDataAdapter, ContextData } from '../../interfaces/IDataAdapter';
import logger from '../../utils/logger';

class WelcomeAdapter implements IDataAdapter {
  public name = 'welcome-adapter';
  
  constructor() {
    logger.info('WelcomeAdapter initialized');
  }
  
  public supportsQuery(query: string): boolean {
    // Keywords specifically for new users and welcome messages
    const welcomeKeywords = [
      'new here', 'first time', 'getting started', 'start using', 
      'how to begin', 'how to start', 'what should i do first',
      'welcome', 'new user', 'beginner', 'tutorial'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return welcomeKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
  }
  
  public async getContextData(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Handling welcome for new user: ${userId}`);
    
    const contextText = `
This is a new user asking how to get started.

Provide a brief welcome message that:
1. Welcomes them to Aurora.io
2. Gives a one-sentence overview that you analyze AWS infrastructure 
3. Suggests starting with a simple question like "What AWS resources do I have?" or "Show me my VPC configuration" 
4. Mentions they can ask for help anytime
5. Keeps the entire response to 3-4 sentences maximum

Be warm but extremely concise.
`;
    
    return {
      text: contextText,
      metadata: {
        source: 'welcome-message',
        timestamp: new Date().toISOString(),
        reliability: 1.0
      }
    };
  }
}

export default WelcomeAdapter; 