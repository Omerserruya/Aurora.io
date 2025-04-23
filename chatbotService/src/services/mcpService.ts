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
    console.log(`MCPService initialized with MCP service URL: ${this.mcpServiceUrl}`);
  }

  /**
   * Process a user query through the MCP service
   */
  public async processQuery(prompt: string, userId: string, connectionId: string, options = {}): Promise<MCPResponse> {
    try {
      console.log(`Processing query via MCP service: "${prompt.substring(0, 50)}..."`);
      console.log(`User ID: ${userId}, Connection ID: ${connectionId}`);
      
      // MCP still expects userId and connectionId in the payload, not URL params
      const payload = {
        prompt,
        userId,
        connectionId,
        options
      };
      
      const response = await axios.post(`${this.mcpServiceUrl}/api/mcp/query`, payload);
      
      if (response.status === 200) {
        console.log('Successfully received response from MCP service');
        
        if (response.data.type === 'error') {
          console.log('MCP service returned an error:', response.data.response);
          // Return the full error object
          return {
            response: response.data.response,
            type: 'error'
          };
        }
        
        // Return response in a standardized format
        return {
          response: response.data.response
        };
      } else {
        throw new Error(`MCP service returned status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error communicating with MCP service:', error.message);
      
      if (error.response) {
        console.error('MCP service error details:', error.response.data);
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
      const response = await axios.get(`${this.mcpServiceUrl}/api/mcp/health`);
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

export default new MCPService(); 