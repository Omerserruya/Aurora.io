export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  format?: 'text' | 'json';
}

export interface ModelInfo {
  provider: string;
  model: string;
  capabilities: string[];
  contextWindow: number;
}

export interface IModelProvider {
  name: string;
  generateResponse(prompt: string, context: string, options?: ModelOptions, chatHistory?: string[],imageData?:string,imageType?:string): Promise<string>;
  getModelInfo(): ModelInfo;
} 