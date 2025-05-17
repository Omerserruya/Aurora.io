import { IDataAdapter, ContextData } from '../../interfaces/IDataAdapter';
import logger from '../../utils/logger';

class ImprovementAdapter implements IDataAdapter {
  public name = 'improvement-adapter';
  
  constructor() {
    logger.info('ImprovementAdapter initialized');
  }
  
  public supportsQuery(query: string): boolean {
    // Keywords related to improvements, optimization, and best practices
    const improvementKeywords = [
      'improve', 'optimization', 'optimize', 'better', 'enhance', 'upgrade',
      'best practice', 'recommendation', 'suggest', 'advice', 'advise',
      'how to make', 'how can i improve', 'how should i', 'what should i do',
      'more efficient', 'performance', 'cost saving', 'save money',
      'security improvement', 'secure', 'protect', 'vulnerabilities',
      'architecture review', 'assessment', 'evaluate'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return improvementKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
  }
  
  public async getContextData(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Handling improvement request from user: ${userId}`);
    
    // Determine what type of improvement they're asking about
    const normalizedQuery = query.toLowerCase();
    
    let improvementFocus = 'general';
    if (normalizedQuery.includes('cost') || normalizedQuery.includes('save money') || normalizedQuery.includes('cheaper')) {
      improvementFocus = 'cost';
    } else if (normalizedQuery.includes('security') || normalizedQuery.includes('secure') || normalizedQuery.includes('protect')) {
      improvementFocus = 'security';
    } else if (normalizedQuery.includes('performance') || normalizedQuery.includes('speed') || normalizedQuery.includes('faster')) {
      improvementFocus = 'performance';
    }
    
    const contextText = `
The user is asking for advice on how to improve their ${improvementFocus} aspects of their AWS environment.

Provide a helpful response that:
1. Acknowledges their request for improvement advice
2. Offers 3-5 specific, actionable recommendations related to ${improvementFocus} improvements
3. For each recommendation, briefly explain the benefit
4. Uses bullet points for clarity and scannability
5. Keeps explanations concise but valuable
6. Ends with an offer to elaborate on any specific recommendation they want to know more about

Be practical, specific, and actionable in your recommendations.
`;
    
    return {
      text: contextText,
      metadata: {
        source: 'improvement-advice',
        timestamp: new Date().toISOString(),
        reliability: 1.0
      }
    };
  }
}

export default ImprovementAdapter; 