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
    // ========== AWS KEYWORD MATCHING LOGIC ==========
    // This adapter only responds to queries containing specific AWS/cloud terms
    // It acts as a technical specialist that should only be called when the user
    // is specifically asking about their cloud resources or infrastructure.
    
    // We use a deliberately targeted list of cloud-specific keywords to avoid this
    // adapter being triggered for general conversation or non-technical queries.
    const cloudKeywords = [
      // Core AWS services
      'aws', 'amazon', 'ec2', 'rds', 's3', 'lambda', 'dynamodb', 'ecs', 'eks',
      'aurora', 'redshift', 'elasticache', 'sqs', 'sns', 'cloudwatch', 'cloudfront',
      'route53', 'iam', 'kms', 'cloudformation', 'apigateway', 'step functions',
      
      // Networking concepts
      'vpc', 'subnet', 'cidr', 'route table', 'acl', 'security group', 'nacl',
      'internet gateway', 'igw', 'nat gateway', 'elb', 'alb', 'nlb', 'load balancer',
      'network', 'firewall', 'transit gateway', 'vpn', 'direct connect', 'endpoint',
      
      // Compute terms
      'instance', 'server', 'container', 'kubernetes', 'ec2', 'ami', 'auto scaling',
      'serverless', 'fargate', 'batch', 'lightsail', 'elastic beanstalk', 'vm',
      
      // Storage terms
      'storage', 'bucket', 's3', 'efs', 'ebs', 'volume', 'snapshot', 'backup',
      'glacier', 'fsx', 'storage gateway', 'object storage', 'block storage',
      
      // Database terms
      'database', 'db', 'rds', 'dynamodb', 'aurora', 'mysql', 'postgres', 'sql',
      'nosql', 'mongodb', 'redis', 'elasticache', 'neptune', 'documentdb',
      
      // Security terms
      'security', 'iam', 'role', 'policy', 'permission', 'encryption', 'kms',
      'certificate', 'acm', 'waf', 'shield', 'guard duty', 'inspector', 'macie',
      
      // Cost and billing terms
      'cost', 'billing', 'price', 'pricing', 'budget', 'spend', 'expense',
      'reservation', 'saving plan', 'on-demand', 'spot', 'reserved instance', 'ri', 
      'cost explorer', 'optimizer', 'allocation', 'usage', 'consumption',
      
      // Developer and DevOps tools
      'codepipeline', 'codecommit', 'codebuild', 'codedeploy', 'codestar',
      'cloud9', 'amplify', 'devops', 'ci/cd', 'pipeline', 'gitops',
      'developer', 'artifact', 'repository', 'ecr', 'container registry',
      
      // General cloud concepts
      'region', 'availability zone', 'az', 'cloud', 'infrastructure', 'resources',
      'architecture', 'environment', 'workload', 'service', 'managed service',
      'provisioning', 'deployment', 'configuration', 'terraform', 'cloudformation'
    ];
    
    // Simple substring matching to identify if any cloud keyword is present
    // This is the trigger that determines if this adapter should handle the query
    // Note: This adapter has lowest priority in ContextService registration order
    return cloudKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }
  
  public async getContextData(userId: string, query: string, connectionId: string): Promise<ContextData> {
    try {
      logger.info(`Retrieving cloud data for user: ${userId}, connection: ${connectionId}`);
      
      // Use the direct query endpoint that finds all resources with matching userId and connectionId
      let apiUrl = `${this.dbServiceUrl}/neo/cloud-query-results/${userId}/${connectionId}`;
      
      const response = await axios.get(apiUrl);
      
      if (response.status === 200 && response.data) {
        logger.info('Successfully retrieved cloud data');
        const formattedData = this.formatAllResourcesData(response.data);
        
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
  
  /**
   * Format the cloud resource data from the new endpoint that returns all nodes
   */
  private formatAllResourcesData(data: any): string {
    try {
      let contextText = 'AWS Cloud Resources for your environment:\n\n';
      
      // Count resources by type
      const nodeTypes = new Map<string, number>();
      const vpcs: any[] = [];
      const subnets: any[] = [];
      const instances: any[] = [];
      const securityGroups: any[] = [];
      const routeTables: any[] = [];
      const internetGateways: any[] = [];
      const networkAcls: any[] = [];
      const loadBalancers: any[] = [];
      const buckets: any[] = [];
      
      // Process VPCs
      if (data.vpcs && Array.isArray(data.vpcs)) {
        data.vpcs.forEach((vpc: any) => {
          vpcs.push(vpc);
          nodeTypes.set('VPC', (nodeTypes.get('VPC') || 0) + 1);
          
          // Process subnets
          if (vpc.subnets && Array.isArray(vpc.subnets)) {
            vpc.subnets.forEach((subnet: any) => {
              subnets.push(subnet);
              nodeTypes.set('Subnet', (nodeTypes.get('Subnet') || 0) + 1);
              
              // Process instances
              if (subnet.instances && Array.isArray(subnet.instances)) {
                subnet.instances.forEach((instance: any) => {
                  instances.push(instance);
                  nodeTypes.set('Instance', (nodeTypes.get('Instance') || 0) + 1);
                });
              }
            });
          }
          
          // Process security groups
          if (vpc.securityGroups && Array.isArray(vpc.securityGroups)) {
            vpc.securityGroups.forEach((sg: any) => {
              securityGroups.push(sg);
              nodeTypes.set('SecurityGroup', (nodeTypes.get('SecurityGroup') || 0) + 1);
            });
          }
          
          // Process route tables
          if (vpc.routeTables && Array.isArray(vpc.routeTables)) {
            vpc.routeTables.forEach((rt: any) => {
              routeTables.push(rt);
              nodeTypes.set('RouteTable', (nodeTypes.get('RouteTable') || 0) + 1);
            });
          }
          
          // Process internet gateways
          if (vpc.internetGateways && Array.isArray(vpc.internetGateways)) {
            vpc.internetGateways.forEach((igw: any) => {
              internetGateways.push(igw);
              nodeTypes.set('InternetGateway', (nodeTypes.get('InternetGateway') || 0) + 1);
            });
          }
          
          // Process network ACLs
          if (vpc.networkAcls && Array.isArray(vpc.networkAcls)) {
            vpc.networkAcls.forEach((acl: any) => {
              networkAcls.push(acl);
              nodeTypes.set('NetworkAcl', (nodeTypes.get('NetworkAcl') || 0) + 1);
            });
          }
          
          // Process load balancers
          if (vpc.loadBalancers && Array.isArray(vpc.loadBalancers)) {
            vpc.loadBalancers.forEach((lb: any) => {
              loadBalancers.push(lb);
              nodeTypes.set('LoadBalancer', (nodeTypes.get('LoadBalancer') || 0) + 1);
            });
          }
        });
      }
      
      // Process S3 buckets
      if (data.s3Buckets && Array.isArray(data.s3Buckets)) {
        data.s3Buckets.forEach((bucket: any) => {
          buckets.push(bucket);
          nodeTypes.set('S3Bucket', (nodeTypes.get('S3Bucket') || 0) + 1);
        });
      }
      
      // Add resource summary
      contextText += 'Resource Summary:\n';
      nodeTypes.forEach((count, type) => {
        contextText += `- ${type}: ${count}\n`;
      });
      
      // Add VPC details
      if (vpcs.length > 0) {
        contextText += '\nVPC Information:\n';
        vpcs.forEach((vpc) => {
          contextText += `- VPC ID: ${vpc.vpcId || 'Unknown'}\n`;
          
          if (vpc.properties) {
            if (vpc.properties.CidrBlock) contextText += `  CIDR: ${vpc.properties.CidrBlock}\n`;
            if (vpc.properties.IsDefault) contextText += `  Default VPC: ${vpc.properties.IsDefault}\n`;
            if (vpc.properties.State) contextText += `  State: ${vpc.properties.State}\n`;
          }
        });
      }
      
      // Add subnet details
      if (subnets.length > 0) {
        contextText += '\nSubnet Information:\n';
        subnets.forEach((subnet) => {
          contextText += `- Subnet ID: ${subnet.subnetId || 'Unknown'}\n`;
          
          if (subnet.properties) {
            if (subnet.properties.CidrBlock) contextText += `  CIDR: ${subnet.properties.CidrBlock}\n`;
            if (subnet.properties.AvailabilityZone) contextText += `  AZ: ${subnet.properties.AvailabilityZone}\n`;
            if (subnet.properties.MapPublicIpOnLaunch) contextText += `  Public IP on Launch: ${subnet.properties.MapPublicIpOnLaunch}\n`;
          }
        });
      }
      
      // Add instance details
      if (instances.length > 0) {
        contextText += '\nEC2 Instance Information:\n';
        instances.forEach((instance) => {
          contextText += `- Instance ID: ${instance.instanceId || 'Unknown'}\n`;
          
          if (instance.properties) {
            if (instance.properties.InstanceType) contextText += `  Type: ${instance.properties.InstanceType}\n`;
            if (instance.properties.State && instance.properties.State.Name) 
              contextText += `  State: ${instance.properties.State.Name}\n`;
            if (instance.properties.PrivateIpAddress) 
              contextText += `  Private IP: ${instance.properties.PrivateIpAddress}\n`;
            if (instance.properties.PublicIpAddress) 
              contextText += `  Public IP: ${instance.properties.PublicIpAddress}\n`;
            
            // Add instance tags if available
            if (instance.properties.Tags && Array.isArray(instance.properties.Tags)) {
              contextText += '  Tags: ';
              instance.properties.Tags.forEach((tag: any, index: number) => {
                if (tag.Key && tag.Value) {
                  contextText += `${tag.Key}=${tag.Value}`;
                  if (index < instance.properties.Tags.length - 1) {
                    contextText += ', ';
                  }
                }
              });
              contextText += '\n';
            }
          }
        });
      }
      
      // Add security group details
      if (securityGroups.length > 0) {
        contextText += '\nSecurity Group Information:\n';
        securityGroups.forEach((sg) => {
          contextText += `- Security Group: ${sg.groupId || 'Unknown'}\n`;
          
          if (sg.properties) {
            if (sg.properties.GroupName) contextText += `  Name: ${sg.properties.GroupName}\n`;
            if (sg.properties.Description) contextText += `  Description: ${sg.properties.Description}\n`;
          }
          
          // Add inbound rules
          if (sg.inboundRules && sg.inboundRules.length > 0) {
            contextText += '  Inbound Rules:\n';
            sg.inboundRules.forEach((rule: any) => {
              contextText += `    - Protocol: ${rule.ipProtocol}\n`;
              if (rule.fromPort !== undefined) contextText += `      From Port: ${rule.fromPort}\n`;
              if (rule.toPort !== undefined) contextText += `      To Port: ${rule.toPort}\n`;
              
              if (rule.userIdGroupPairs && rule.userIdGroupPairs.length > 0) {
                contextText += '      Source Security Groups:\n';
                rule.userIdGroupPairs.forEach((pair: any) => {
                  contextText += `        - Group ID: ${pair.GroupId}\n`;
                });
              }
              
              if (rule.ipRanges && rule.ipRanges.length > 0) {
                contextText += '      Source IP Ranges:\n';
                rule.ipRanges.forEach((range: any) => {
                  contextText += `        - ${range.CidrIp}\n`;
                });
              }
              
              if (rule.ipv6Ranges && rule.ipv6Ranges.length > 0) {
                contextText += '      Source IPv6 Ranges:\n';
                rule.ipv6Ranges.forEach((range: any) => {
                  contextText += `        - ${range.CidrIpv6}\n`;
                });
              }
            });
          }
          
          // Add outbound rules
          if (sg.outboundRules && sg.outboundRules.length > 0) {
            contextText += '  Outbound Rules:\n';
            sg.outboundRules.forEach((rule: any) => {
              contextText += `    - Protocol: ${rule.ipProtocol}\n`;
              if (rule.fromPort !== undefined) contextText += `      From Port: ${rule.fromPort}\n`;
              if (rule.toPort !== undefined) contextText += `      To Port: ${rule.toPort}\n`;
              
              if (rule.userIdGroupPairs && rule.userIdGroupPairs.length > 0) {
                contextText += '      Destination Security Groups:\n';
                rule.userIdGroupPairs.forEach((pair: any) => {
                  contextText += `        - Group ID: ${pair.GroupId}\n`;
                });
              }
              
              if (rule.ipRanges && rule.ipRanges.length > 0) {
                contextText += '      Destination IP Ranges:\n';
                rule.ipRanges.forEach((range: any) => {
                  contextText += `        - ${range.CidrIp}\n`;
                });
              }
            });
          }
        });
      }
      
      return contextText;
    } catch (error: any) {
      logger.error(`Error formatting cloud data: ${error.message}`);
      return '';
    }
  }
}

export default CloudDataAdapter;