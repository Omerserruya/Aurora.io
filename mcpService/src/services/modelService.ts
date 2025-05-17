import { IModelProvider, ModelOptions } from '../interfaces/IModelProvider';
import GeminiProvider from './providers/geminiProvider';
import { environment } from '../config/environment';
import logger from '../utils/logger';

class ModelService {
  private providers: Map<string, IModelProvider> = new Map();
  private defaultProvider: string;
  
  constructor() {
    // Register Gemini provider (the only one we're supporting)
    this.registerProvider(new GeminiProvider());
    
    // Set default provider
    this.defaultProvider = environment.defaultModelProvider;
    
    logger.info(`ModelService initialized with default provider: ${this.defaultProvider}`);
    logger.info(`Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }
  
  private registerProvider(provider: IModelProvider): void {
    this.providers.set(provider.name, provider);
  }
  
  public async generateResponse(
    prompt: string, 
    context: string, 
    options: ModelOptions = {}
  ): Promise<string> {
    // We're only using Gemini in this implementation
    const providerName = 'gemini';
    
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Model provider "${providerName}" not available`);
    }
    
    logger.info(`Generating response using ${providerName} provider`);
    return provider.generateResponse(prompt, context, options);
  }
  
  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
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