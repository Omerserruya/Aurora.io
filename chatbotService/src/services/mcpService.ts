import axios from 'axios';
import { environment } from '../config/environment';

class MCPService {
  private mcpServiceUrl: string;
  
  constructor() {
    this.mcpServiceUrl = environment.mcpServiceUrl;
    console.log(`MCPService initialized with MCP service URL: ${this.mcpServiceUrl}`);
  }

  /**
   * Process a user query through the MCP service
   */
  public async processQuery(prompt: string, userId: string, options = {}): Promise<string> {
    try {
      const response = await axios.post(`${this.mcpServiceUrl}/api/mcp/query`, {
        prompt,
        userId,
        options
      });
      
      if (response.status === 200) {
        console.log('Successfully received response from MCP service');
        
        if (response.data.type === 'error') {
          console.log('MCP service returned an error:', response.data.response);
          return response.data.response;
        }
        
        return response.data.response;
      } else {
        throw new Error(`MCP service returned status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error communicating with MCP service:', error.message);
      
      if (error.response) {
        console.error('MCP service error details:', error.response.data);
      }
      
      throw new Error(`Failed to process query via MCP: ${error.message}`);
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