import { IDataAdapter, ContextData } from '../../interfaces/IDataAdapter';
import axios from 'axios';
import { environment } from '../../config/environment';
import logger from '../../utils/logger';

class CloudDataAdapter implements IDataAdapter {
  public name = 'cloud-data';
  private dbServiceUrl: string;
  
  constructor() {
    this.dbServiceUrl = environment.dbServiceUrl;
    logger.info(`CloudDataAdapter initialized with DB service URL: ${this.dbServiceUrl}`);
  }
  
  public supportsQuery(query: string): boolean {
    // Check if the query is about cloud resources, infrastructure, etc.
    const cloudKeywords = [
      'aws', 'ec2', 'rds', 's3', 'vpc', 'subnet', 'security', 
      'cloud', 'instance', 'database', 'bucket', 'network',
      'infrastructure', 'resources', 'region', 'architecture'
    ];
    
    return cloudKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }
  
  public async getContextData(userId: string, query: string): Promise<ContextData> {
    try {
      logger.info(`Retrieving cloud data for user: ${userId}`);
      
      const response = await axios.get(`${this.dbServiceUrl}/api/cloud-data/${userId}`);
      
      if (response.status === 200 && response.data) {
        logger.info('Successfully retrieved cloud data');
        const formattedData = this.formatCloudData(response.data);
        
        return {
          text: formattedData,
          metadata: {
            source: 'cloud-infrastructure',
            timestamp: new Date().toISOString(),
            reliability: 0.9
          }
        };
      } else {
        throw new Error('Invalid response from DB service');
      }
    } catch (error: any) {
      logger.error(`Error retrieving cloud data: ${error.message}`);
      
      if (error.response && error.response.status === 404) {
        return {
          text: '',
          metadata: {
            source: 'cloud-infrastructure',
            timestamp: new Date().toISOString(),
            reliability: 0
          },
          error: 'No cloud data found for this user. Please connect your cloud account or create cloud resources first.'
        };
      }
      
      return {
        text: '',
        metadata: {
          source: 'cloud-infrastructure',
          timestamp: new Date().toISOString(),
          reliability: 0
        },
        error: `Failed to retrieve cloud data: ${error.message}`
      };
    }
  }
  
  private formatCloudData(data: any): string {
    try {
      let contextText = '';
      
      if (data.environment) {
        contextText += `User environment: ${data.environment.name || 'Unknown'}\n`;
        contextText += `Provider: ${data.environment.provider || 'Unknown'}\n`;
        contextText += `Region: ${data.environment.region || 'Unknown'}\n`;
      }
      
      if (data.resources && Array.isArray(data.resources)) {
        contextText += `\nResources:\n`;
        data.resources.forEach((resource: any) => {
          contextText += `- ${resource.type || 'Unknown'}: ${resource.name || 'Unnamed'}\n`;
          
          // Add specific details based on resource type
          if (resource.type === 'EC2') {
            contextText += `  Instance Type: ${resource.instanceType || 'Unknown'}\n`;
            contextText += `  Count: ${this.extractNumberValue(resource.count) || 1}\n`;
          } else if (resource.type === 'RDS') {
            contextText += `  Engine: ${resource.engine || 'Unknown'}\n`;
            contextText += `  Storage: ${this.extractNumberValue(resource.storage) || 'Unknown'}GB\n`;
          } else if (resource.type === 'S3') {
            contextText += `  Bucket Count: ${this.extractNumberValue(resource.count) || 1}\n`;
          }
          
          if (resource.details) {
            contextText += `  Details: ${resource.details}\n`;
          }
        });
      }
      
      if (data.network) {
        contextText += `\nNetwork Configuration:\n`;
        if (data.network.vpcCidr) {
          contextText += `- VPC CIDR: ${data.network.vpcCidr}\n`;
        }
        if (data.network.subnets && Array.isArray(data.network.subnets)) {
          const publicSubnets = data.network.subnets.filter((s: any) => s.type === 'public');
          const privateSubnets = data.network.subnets.filter((s: any) => s.type === 'private');
          
          if (publicSubnets.length > 0) {
            contextText += `- Public subnets: ${publicSubnets.map((s: any) => s.cidr).join(', ')}\n`;
          }
          
          if (privateSubnets.length > 0) {
            contextText += `- Private subnets: ${privateSubnets.map((s: any) => s.cidr).join(', ')}\n`;
          }
        }
      }
      
      if (data.security) {
        contextText += `\nSecurity:\n`;
        if (data.security.settings && Array.isArray(data.security.settings)) {
          data.security.settings.forEach((setting: any) => {
            contextText += `- ${setting}\n`;
          });
        }
      }
      
      return contextText;
    } catch (error: any) {
      logger.error('Error formatting cloud data:', error);
      return `Error processing cloud data: ${error.message || 'Unknown error'}`;
    }
  }

  /**
   * Helper method to extract numeric values from Neo4j integer objects
   */
  private extractNumberValue(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    
    // Handle Neo4j integer objects which have a 'low' property
    if (typeof value === 'object' && value !== null && 'low' in value) {
      return value.low;
    }
    
    // Handle regular numbers
    if (typeof value === 'number') {
      return value;
    }
    
    // Try to parse string values
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    return null;
  }
}

export default CloudDataAdapter; 