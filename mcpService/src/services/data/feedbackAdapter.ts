import { IDataAdapter, ContextData } from '../../interfaces/IDataAdapter';
import logger from '../../utils/logger';

class FeedbackAdapter implements IDataAdapter {
  public name = 'feedback-adapter';
  
  constructor() {
    logger.info('FeedbackAdapter initialized');
  }
  
  public supportsQuery(query: string): boolean {
    // Keywords for feedback, appreciation, or complaints
    const feedbackKeywords = [
      'thank', 'thanks', 'good job', 'great', 'helpful', 'appreciate',
      'awesome', 'excellent', 'perfect', 'well done', 'happy with',
      'bad', 'terrible', 'unhelpful', 'wrong', 'incorrect', 'not helpful',
      'useless', 'disappointed', 'feedback', 'suggestion', 'improve',
      'better if', 'could you instead', 'not working', 'doesn\'t work',
      'issue', 'problem'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return feedbackKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
  }
  
  public async getContextData(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Handling feedback from user: ${userId}`);
    
    // Determine if it's positive or negative feedback
    const normalizedQuery = query.toLowerCase();
    const positiveKeywords = ['thank', 'thanks', 'good', 'great', 'helpful', 'awesome', 'excellent', 'perfect'];
    const negativeKeywords = ['bad', 'terrible', 'unhelpful', 'wrong', 'incorrect', 'useless', 'disappointed', 'not working'];
    
    const isPositive = positiveKeywords.some(keyword => normalizedQuery.includes(keyword));
    const isNegative = negativeKeywords.some(keyword => normalizedQuery.includes(keyword));
    
    let feedbackType = 'neutral';
    if (isPositive && !isNegative) feedbackType = 'positive';
    if (isNegative && !isPositive) feedbackType = 'negative';
    
    const contextText = `
The user is providing ${feedbackType} feedback.

Respond with a very brief, appropriate message that:
1. Acknowledges their feedback with gratitude
2. If positive: expresses pleasure at being able to help
3. If negative: apologizes and offers to try a different approach
4. In all cases: encourages them to continue with their AWS queries
5. Keeps the entire response to 1-2 sentences maximum

Be sincere but extremely concise.
`;
    
    return {
      text: contextText,
      metadata: {
        source: 'user-feedback',
        timestamp: new Date().toISOString(),
        reliability: 1.0
      }
    };
  }
}

export default FeedbackAdapter; 