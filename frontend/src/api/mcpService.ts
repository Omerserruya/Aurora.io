import axios from 'axios';

export interface MCPResponse {
  response: string;
  error?: string;
}

export interface QueryOptions {
  temperature?: number;
  maxTokens?: number;
}

export const mcpService = {
  sendQuery: async (
    prompt: string,
    userId: string,
    connectionId: string,
    options: QueryOptions = {},
    chatHistory: string[] = [],
    imageData?: string,
    imageType?: string
  ): Promise<MCPResponse> => {
    try {
      const response = await axios.post(
        `/api/chatbot/query/${userId}/${connectionId}`,
        {
          prompt,
          options,
          chatHistory,
          imageData,
          imageType
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        }
        throw new Error(error.response?.data?.message || 'Failed to send query');
      }
      throw error;
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await axios.get('/api/chatbot/health', {
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}; 