import { IDataAdapter, ContextData } from '../../interfaces/IDataAdapter';
import logger from '../../utils/logger';

class TroubleshootingAdapter implements IDataAdapter {
  public name = 'troubleshooting-adapter';
  
  constructor() {
    logger.info('TroubleshootingAdapter initialized');
  }
  
  public supportsQuery(query: string): boolean {
    // Keywords related to problems, issues, and troubleshooting
    const troubleshootingKeywords = [
      'issue', 'problem', 'error', 'not working', 'broken', 'fail', 'failure',
      'troubleshoot', 'debug', 'diagnose', 'fix', 'solve', 'resolution',
      'stuck', 'help with', 'can\'t connect', 'unable to', 'doesn\'t work',
      'down', 'outage', 'crashed', 'slow', 'latency', 'timeout',
      'why is', 'why does', 'what\'s wrong', 'how to fix'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return troubleshootingKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
  }
  
  public async getContextData(userId: string, query: string, connectionId: string): Promise<ContextData> {
    logger.info(`Handling troubleshooting request from user: ${userId}`);
    
    // Try to determine what service they're having issues with
    const normalizedQuery = query.toLowerCase();
    const serviceKeywords = {
      'ec2': ['ec2', 'instance', 'server', 'compute', 'vm'],
      's3': ['s3', 'bucket', 'storage', 'object'],
      'rds': ['rds', 'database', 'db', 'sql', 'mysql', 'postgres', 'aurora'],
      'vpc': ['vpc', 'network', 'subnet', 'routing', 'connection'],
      'iam': ['iam', 'permission', 'access', 'role', 'user', 'policy'],
      'lambda': ['lambda', 'function', 'serverless'],
      'general': ['aws', 'cloud', 'console', 'cli']
    };
    
    let serviceType = 'general';
    for (const [service, keywords] of Object.entries(serviceKeywords)) {
      if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
        serviceType = service;
        break;
      }
    }
    
    const contextText = `
The user is asking for help troubleshooting an issue with their ${serviceType} AWS resources.

Provide a helpful response that:
1. Acknowledges their issue and expresses understanding
2. Offers 3-5 common troubleshooting steps for ${serviceType} issues
3. Suggests verification methods to identify root causes
4. Uses a step-by-step approach for clarity
5. Mentions relevant AWS tools or logs that might help diagnose the issue
6. Keeps explanations clear and concise
7. Offers to help with more specific details if they can provide them

Be practical and focus on common solutions without being overly technical.
`;
    
    return {
      text: contextText,
      metadata: {
        source: 'troubleshooting-guide',
        timestamp: new Date().toISOString(),
        reliability: 1.0
      }
    };
  }
}

export default TroubleshootingAdapter; 