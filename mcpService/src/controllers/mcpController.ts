import { Request, Response } from 'express';
import modelService from '../services/modelService';
import contextService from '../services/contextService';
import logger from '../utils/logger';

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
        options
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
  }
}; 