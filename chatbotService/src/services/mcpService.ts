import axios from 'axios';
import { environment } from '../config/environment';

// Define response type interface
interface MCPResponse {
  response: string;
  type?: string;
}

class MCPService {
  private mcpServiceUrl: string;
  
  constructor() {
    this.mcpServiceUrl = environment.mcpServiceUrl;
  }

  /**
   * Process a user query through the MCP service
   */
  public async processQuery(prompt: string, userId: string, connectionId: string, options = {},chatHistory: string[] = []
  ): Promise<MCPResponse> {
    // Log incoming request
    
    try {
      // MCP still expects userId and connectionId in the payload, not URL params
      const payload = {
        prompt,
        userId,
        connectionId,
        options,
        chatHistory
      };
      
      const response = await axios.post(`${this.mcpServiceUrl}/api/mcp/query`, payload, {
        timeout: 120000, // 120 second timeout for AI responses
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200) {
        
        if (response.data.type === 'error') {
          console.warn('[MCPService] MCP service returned an error:', response.data.response);
          // Return the full error object
          return {
            response: response.data.response,
            type: 'error'
          };
        }
        
        // Log success
        
        // Return response in a standardized format
        return {
          response: response.data.response
        };
      } else {
        throw new Error(`MCP service returned status ${response.status}`);
      }
    } catch (error: any) {
      console.error('[MCPService] Error communicating with MCP service:', error.message);
      
      // Log detailed error information
      if (error.response) {
        console.error('[MCPService] Error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('[MCPService] No response received:', error.request);
      }
      
      // Return error in standardized format
      return {
        response: `Failed to process query via MCP: ${error.message}`,
        type: 'error'
      };
    }
  }

  /**
   * Check health of the MCP service
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.mcpServiceUrl}/api/mcp/health`, {
        timeout: 5000 // 5 second timeout for health check
      });
      const isHealthy = response.status === 200 && response.data.status === 'healthy';
      return isHealthy;
    } catch (error) {
      console.error('[MCPService] Health check failed:', error);
      return false;
    }
  }
}

export default new MCPService(); 