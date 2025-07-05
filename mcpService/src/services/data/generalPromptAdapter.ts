import { IDataAdapter, ContextData } from '../../interfaces/IDataAdapter';
import logger from '../../utils/logger';

class GeneralPromptAdapter implements IDataAdapter {
  public name = 'general-prompt';
  
  constructor() {
    logger.info('GeneralPromptAdapter initialized');
  }
  
  public supportsQuery(query: string): boolean {
    // Keywords for greetings and general questions
    const generalKeywords = [
      'hi', 'hello', 'hey', 'greetings', 'howdy',
      'what can you do', 'what can you help with', 'help me', 
      'who are you', 'what are you', 'your capabilities', 
      'what can you assist', 'how can you help', 'tell me about yourself',
      'good morning', 'good afternoon', 'good evening', 'welcome',
      'intro', 'introduction', 'get started', 'starting', 'begin',
      'explain', 'how does this work', 'how do you work', 'what is this',
      'options', 'features', 'capabilities', 'what should i ask',
      'new user', 'first time', 'assistance', 'help', 'guide me',
      'tell me what', 'show me what', 'explain what'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check if query starts with any of the keywords or matches completely or contains the keywords
    return generalKeywords.some(keyword => 
      normalizedQuery.startsWith(keyword) || 
      normalizedQuery === keyword ||
      normalizedQuery.includes(keyword)
    );
  }
  
  public async getContextData(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Handling general prompt from user: ${userId}`);
    
    // Create helpful context for the AI to use when responding to general queries
    const contextText = `
This is a general greeting or question about capabilities.

The user is asking a general question or saying hello. Provide a brief, friendly response that:
1. Introduces yourself as Aurora, an AWS cloud architecture assistant from Aurora.io
2. Briefly mentions you can help with AWS infrastructure analysis, security, and optimization
3. Provides 2-3 example questions at most
4. Uses a warm, professional tone
5. Keeps the entire response under 4 sentences total

IMPORTANT: Be extremely concise while remaining friendly and helpful. Your response should be short and to the point.
`;
    
    return {
      text: contextText,
      metadata: {
        source: 'general-greeting',
        timestamp: new Date().toISOString(),
        reliability: 1.0
      }
    };
  }
}

export default GeneralPromptAdapter; 