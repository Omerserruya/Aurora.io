import { IDataAdapter, ContextData } from '../../interfaces/IDataAdapter';
import logger from '../../utils/logger';

class HelpAdapter implements IDataAdapter {
  public name = 'help-adapter';
  
  constructor() {
    logger.info('HelpAdapter initialized');
  }
  
  public supportsQuery(query: string): boolean {
    // Keywords specifically for help requests
    const helpKeywords = [
      'help', 'how to use', 'assistance', 'guide me', 'instructions',
      'tips', 'examples', 'usage', 'show me how', 'explain how to',
      'need help with'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // If query is exactly "help" or starts with "help" or contains specific help phrases
    return normalizedQuery === 'help' || 
           normalizedQuery.startsWith('help ') || 
           helpKeywords.some(keyword => normalizedQuery.includes(keyword));
  }
  
  public async getContextData(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Handling help request from user: ${userId}`);
    
    const contextText = `
The user is asking for help with how to use the system.

Provide a helpful but concise response that:
1. Clearly explains they can ask about their AWS resources, security, and infrastructure
2. Lists 3-4 example questions using bullet points, such as:
   • "What EC2 instances do I have?"
   • "Describe my VPC configuration"
   • "Are there security risks in my setup?"
   • "How can I optimize my costs?"
3. Mentions they can ask for details about specific resources
4. Keeps the entire response brief and easy to understand

Focus on being helpful but concise.
`;
    
    return {
      text: contextText,
      metadata: {
        source: 'help-guide',
        timestamp: new Date().toISOString(),
        reliability: 1.0
      }
    };
  }
}

export default HelpAdapter; 