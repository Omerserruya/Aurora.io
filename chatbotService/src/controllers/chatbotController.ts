import { Request, Response } from 'express';
import mcpService from '../services/mcpService';

export const chatbotController = {
  /**
   * Process a user query and return AI-generated response
   */
  async processQuery(req: Request, res: Response): Promise<void> {
    try {
      console.log('Processing new chat request');
      
      // Extract userId and connectionId from URL parameters
      const { userId, connectionId } = req.params;
      
      // Extract prompt from request body
      const { prompt , options , chatHistory , imageData, imageType } = req.body;
      
      if (!prompt) {
        console.log('Missing prompt in request');
        res.status(400).json({ error: 'Missing prompt parameter' });
        return;
      }
      
      if (!userId) {
        console.log('Missing userId in URL parameters');
        res.status(400).json({ error: 'Missing userId parameter' });
        return;
      }
      
      if (!connectionId) {
        console.log('Missing connectionId in URL parameters');
        res.status(400).json({ error: 'Missing connectionId parameter' });
        return;
      }
      
      console.log(`Received query from user ${userId}: "${prompt}"`);
      console.log(`Using connection ID: ${connectionId}`);
      
      try {
        // Process the query using MCP service
        const mcpResponse = await mcpService.processQuery(prompt, userId, connectionId,options, chatHistory , imageData, imageType);
        
        // Log the response for debugging
        console.log('MCP Response:', mcpResponse);
        
        // Check if it's an error response
        if (mcpResponse.type === 'error') {
          console.log('MCP service returned an error:', mcpResponse.response);
          res.status(200).json({ 
            response: mcpResponse.response,
            type: 'error'
          });
          return;
        }
        
        console.log('Query processed successfully');
        res.status(200).json({ response: mcpResponse.response });
      } catch (error: any) {
        console.error('Error processing request:', error);
        // Return a user-friendly error message
        res.status(500).json({ 
          error: 'An error occurred while processing your request',
          message: error.message || 'Unknown error'
        });
      }
    } catch (error: any) {
      console.error('Unexpected error in chatbot controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  /**
   * Check health status of the chatbot service
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      console.log('Health check requested');
      
      // Check MCP service health
      const mcpHealth = await mcpService.checkHealth();
      
      res.status(200).json({ 
        status: 'ok', 
        service: 'chatbot-service',
        dependencies: {
          mcp: mcpHealth ? 'healthy' : 'unhealthy'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(500).json({ status: 'error', error: 'Internal server error' });
    }
  }
}; 