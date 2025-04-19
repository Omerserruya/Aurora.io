export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface ModelInfo {
  provider: string;
  model: string;
  capabilities: string[];
  contextWindow: number;
}

export interface IModelProvider {
  name: string;
  generateResponse(prompt: string, context: string, options?: ModelOptions): Promise<string>;
  getModelInfo(): ModelInfo;
} 