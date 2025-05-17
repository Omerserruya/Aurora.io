import { IModelProvider, ModelOptions } from '../interfaces/IModelProvider';
import GeminiProvider from './providers/geminiProvider';
import logger from '../utils/logger';

class ModelService {
  private providers: Map<string, IModelProvider>;
  private defaultProvider: string;
  
  constructor() {
    this.providers = new Map();
    this.defaultProvider = 'gemini';
    
    // Initialize providers
    this.providers.set('gemini', new GeminiProvider());
    
    logger.info(`ModelService initialized with default provider: ${this.defaultProvider}`);
    logger.info(`Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }
  
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  async generateResponse(
    prompt: string, 
    context: string, 
    options: ModelOptions = {}
  ): Promise<string> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`Provider ${this.defaultProvider} not found`);
    }

    let formattedPrompt = prompt;
    // Only add JSON formatting instructions if format is 'json'
    if (options.format === 'json') {
      formattedPrompt = `${prompt}\n\nIMPORTANT: Your response must be a valid JSON array wrapped in a markdown code block like this:\n\`\`\`json\n[...]\n\`\`\``;
    }
    // For normal chat, do not add any JSON formatting instructions

    logger.info(`Generating response with ${this.defaultProvider} for: ${formattedPrompt.substring(0, 100)}...`);
    
    try {
      const response = await provider.generateResponse(formattedPrompt, context, options);
      logger.info('Generated response successfully');
      return response;
    } catch (error) {
      logger.error(`Error generating response: ${error}`);
      throw error;
    }
  }
  
  public getProviderInfo(providerName: string): any {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Model provider "${providerName}" not available`);
    }
    
    return provider.getModelInfo();
  }
}

export default new ModelService(); 