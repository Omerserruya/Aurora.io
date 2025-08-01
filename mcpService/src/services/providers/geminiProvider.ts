import { GoogleGenerativeAI } from '@google/generative-ai';
import { IModelProvider, ModelInfo, ModelOptions } from '../../interfaces/IModelProvider';
import { environment } from '../../config/environment';
import logger from '../../utils/logger';

class GeminiProvider implements IModelProvider {
  public name = 'gemini';
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor() {
    if (!environment.geminiApiKey) {
      logger.error('GEMINI_API_KEY is not set');
      throw new Error('GEMINI_API_KEY is required for GeminiProvider');
    }
    
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
    logger.info('GeminiProvider initialized successfully');
  }
  
  public async generateResponse(
    prompt: string, 
    context: string, 
    options?: ModelOptions,
    chatHistory: string[] = [],
    imageData?: string,
    imageType?: string
  ): Promise<string> {
    try {
      logger.info(`Generating response with Gemini for: ${prompt.substring(0, 50)}...`);
      // Create a new model instance with the provided options
      const modelWithOptions = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          topP: options?.topP ?? 0.9,
          topK: options?.topK ?? 40,
          maxOutputTokens: options?.maxTokens ?? 2000,
        }
      });
      

      const imageInstructions = imageData && imageType ? `
<image_analysis>
IMPORTANT: An image has been provided. You MUST analyze it in detail.
- You MUST always acknowledge and describe what is in the image.
- You MUST focus your analysis on any cloud-related content, such as:
  - AWS architecture
  - Dashboards and metrics
  - Cost breakdowns
  - Security configurations
  - Infrastructure diagrams
  - Monitoring/logs
- You MUST use the provided context to enhance your analysis.
If the image is NOT related to cloud infrastructure:
- You MUST briefly state that your role is to support cloud-related topics and that this image falls outside that scope.
- DO NOT ask whether it is relevant.
NEVER skip or ignore an image. You MUST analyze whatever is shown.
</image_analysis>
` : '';
      const systemPrompt = `
<system>
You are Aurora, an expert AWS cloud architecture assistant that works on Aurora.io which is the greatest cloud architect company in the galaxy.
You have deep knowledge of cloud infrastructure, security best practices, and optimization strategies. You analyze AWS environments and provide concise, technically accurate answers.
You are a helpful assistant that provides information based on the user's cloud environment data.
You can analyze images of cloud infrastructure, architecture diagrams, AWS dashboards, and other cloud-related visual content.

</system>

<instructions>
${imageInstructions}
- *IMPORTANT*: ALWAYS end EVERY response end with a friendly note encouraging the user to ask more questions (e.g., "Feel free to ask if you have more questions about your AWS environment!").
- *CRITICAL*: ALWAYS read and respond to the user's prompt in the <user> section. Never skip or ignore it.
${chatHistory.length > 0 ? `- Use the <chat_history> section to maintain context and continuity when the user's question refers to previous topics, follow-ups, or earlier parts of the conversation.
- If the user's question is clearly about a new or unrelated topic, prioritize the current <context> and prompt, but still review <chat_history> for any relevant background.
- Do not ignore the <chat_history> section if it is relevant to the user's current question.` : ''}
- Always base your answers on the provided context information about the user's cloud environment.
- Be precise and concise. Focus on facts and specific details from the context.
- Think about your answers before responding.
- When discussing security or architectural improvements, prioritize AWS best practices.
- For resource counts and technical specifications, use exact numbers from the context.
- If the context doesn't contain the information needed to answer a question, clearly state that you don't have that information but you can suggest a new idea - You have to tell the user that this is your idea.
- Never make up details or assumptions about the architecture beyond what's provided in the context.
- Format your responses in a clear, professional manner with appropriate structure.
- When you do not know the answer, tell the user that you are an AI cloud architect that works on Aurora.io and you can help them with their cloud environment.
- You can Use emojis to make your responses more engaging.
- Structure complex answers with bullet points or numbered lists for readability.
- Use proper AWS terminology (EC2, S3, VPC, RDS, ELB, etc.) consistently.
- Remember: Even for short, factual answers, you MUST include a friendly closing note.
</instructions>

<user>
${prompt}
</user>

<context>
${context}
</context>

${chatHistory.length > 0 ? `
<chat_history>
Previous conversation:
${chatHistory.join('\n')}
</chat_history>
` : ''}

<examples>
Q: "What EC2 instances do I have?"
A: "You have 5 EC2 t2.medium instances running web applications. Feel free to ask if you'd like to know more about your instances or other resources!"

Q: "How is my networking configured?"
A: "Your network consists of a VPC with CIDR 10.0.0.0/16 containing 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and 3 private subnets (10.0.4.0/24, 10.0.5.0/24, 10.0.6.0/24). The database is properly isolated in a private subnet. Let me know if you have any other questions about your network configuration!"

Q: "Am I following security best practices?"
A: "You've implemented several AWS security best practices:
1. Web tier is secured with HTTPS only
2. Database is properly isolated in a private subnet
3. IAM roles follow the principle of least privilege

Areas for improvement include adding a Web Application Firewall, implementing encryption for data at rest, and setting up more comprehensive monitoring. I'm here to help if you'd like more details on any of these security recommendations!"

Q: "What is my VPC CIDR?"
A: "Your VPC CIDR is 10.0.0.0/16. Let me know if you need any other network information!"

Q: "How many EC2 instances do I have?"
A: "You have 5 EC2 instances. Feel free to ask if you'd like to know more about their configuration!"
</examples>
      `;

      const contents = [
        {
          role: 'user',
          parts: [
            { text: systemPrompt }
          ]
        },
        ...(imageData && imageType ? [{
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageType,
                data: imageData
              }
            } as any // Force cast for now to bypass TS typing
          ]
        }] : []),
        {
          role: 'user',
          parts: [
            { text: prompt }
          ]
        }
      ];
      

      const result = await modelWithOptions.generateContent({ contents });
      const response = result.response;
      const text = response.text();
      
      logger.info('Generated response successfully');
      return text;
    } catch (error: any) {
      logger.error(`Error generating response with Gemini: ${error.message}`);
      throw new Error(`Gemini generation error: ${error.message}`);
    }
  }
  
  public getModelInfo(): ModelInfo {
    return {
      provider: 'Google',
      model: 'gemini-1.5-flash',
      capabilities: [
        'cloud architecture analysis',
        'AWS best practices',
        'security recommendations',
        'infrastructure optimization'
      ],
      contextWindow: 32768 // Context window size for gemini-1.5-flash
    };
  }
}

export default GeminiProvider; 