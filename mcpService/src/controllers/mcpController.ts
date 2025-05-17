import { Request, Response } from 'express';
import modelService from '../services/modelService';
import contextService from '../services/contextService';
import logger from '../utils/logger';

const SYSTEM_PROMPT = `You are an expert cloud architect and security specialist. Analyze the following cloud infrastructure and provide the 3 most valuable recommendations.\n\nInstructions:\n- Each recommendation must be SHORT and CONCISE (1-2 sentences for problem and impact).\n- ALWAYS prioritize the highest severity issues: if there are any critical (error) issues, recommend those first, then medium, then low.\n- For each recommendation, provide:\n  1. A clear, concise title\n  2. A brief description of the problem (1-2 sentences max)\n  3. The potential impact (1-2 sentences max)\n  4. severity: string (must be one of: \"Critical\", \"Medium\", \"Low\")\n  5. A relevant MUI icon name (e.g., Security, Warning, TrendingUp)\n  6. A detailed chat prompt that explains the problem and suggests specific actions\n- Focus on:\n  - Security vulnerabilities\n  - Cost optimization opportunities\n  - Architecture improvements\n  - Performance bottlenecks\n- Format the response as a JSON array of recommendations.`;

export const mcpController = {
  /**
   * Process a user query using the MCP
   */
  async processQuery(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
    
    try {
      logger.info(`[${requestId}] Processing request`);
      
      const { prompt, userId, connectionId, options = {} } = req.body;
      
      if (!prompt || !userId) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }
      
      if (!connectionId) {
        logger.error(`[${requestId}] Missing connectionId parameter`);
        res.status(400).json({ error: 'Missing connectionId parameter' });
        return;
      }
      
      logger.info(`Request from user ${userId}, connection ${connectionId}`);
      
      // Get appropriate context from all relevant data sources
      const context = await contextService.getContext(userId, prompt, connectionId);
      
      if (context.error) {
        logger.warn(`[${requestId}] Context error: ${context.error}`);
        res.status(200).json({ 
          response: context.error,
          type: 'error'
        });
        return;
      }
      logger.log('Context:', context);
      // Generate response using Gemini
      const response = await modelService.generateResponse(
        prompt, 
        context.text, 
        { ...options, format: 'text' } // Specify text format for chat
      );
      
      // Capture metrics
      const duration = Date.now() - startTime;
      
      logger.info(`[${requestId}] Request processed in ${duration}ms`);
      res.status(200).json({ response });
    } catch (error: any) {
      logger.error(`[${requestId}] Error: ${error.message}`);
      res.status(500).json({ 
        error: 'Processing error',
        message: error.message
      });
    }
  },
  
  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Health check requested');
      
      // Check if model service is available
      const providers = modelService.getAvailableProviders();
      
      res.status(200).json({
        status: 'healthy',
        service: 'mcp-service',
        providers,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error(`Health check failed: ${error.message}`);
      res.status(500).json({ 
        status: 'unhealthy',
        error: error.message
      });
    }
  },

  /**
   * Get AI recommendations for cloud infrastructure
   */
  async getRecommendations(req: Request, res: Response) {
    try {
      const { userId, connectionId } = req.query;
      
      if (!userId || !connectionId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      console.info(`Getting recommendations for user ${userId}, connection ${connectionId}`);
      
      // Get context data
      const context = await contextService.getContext(
        userId as string,
        'infrastructure analysis',
        connectionId as string
      );

      // If no cloud data is found, return a specific recommendation
      if (context.text.includes('No cloud infrastructure data found')) {
        return res.json({
          recommendations: [{
            title: 'Connect Cloud Account',
            problem: 'No cloud infrastructure data is available for analysis.',
            impact: 'Unable to provide infrastructure recommendations without cloud data.',
            color: 'warning',
            icon: 'CloudOff',
            chatPrompt: 'Would you like help connecting your cloud account?'
          }]
        });
      }

      // Generate recommendations using Gemini
      const response = await modelService.generateResponse(
        SYSTEM_PROMPT,
        context.text,
        { format: 'json' } // Specify JSON format for recommendations
      );

      // Extract JSON from the response (remove markdown code block and any extra text)
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', response);
        return res.status(500).json({ error: 'Invalid response format' });
      }
      
      const jsonStr = jsonMatch[1].trim();
      
      try {
        const recommendations = JSON.parse(jsonStr);
        return res.json({ recommendations });
      } catch (parseError) {
        console.error('Error parsing recommendations:', parseError);
        console.error('Raw response:', response);
        return res.status(500).json({ error: 'Failed to parse recommendations' });
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }
}; 