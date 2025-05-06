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
              
              if (rule.ipv6Ranges && rule.ipv6Ranges.length > 0) {
                contextText += '      Destination IPv6 Ranges:\n';
                rule.ipv6Ranges.forEach((range: any) => {
                  contextText += `        - ${range.CidrIpv6}\n`;
                });
              }
            });
          }
        });
      }
      
      // Add route table details
      if (routeTables.length > 0) {
        contextText += '\nRoute Table Information:\n';
        routeTables.forEach((rt) => {
          contextText += `- Route Table ID: ${rt.routeTableId || 'Unknown'}\n`;
          
          if (rt.routes && rt.routes.length > 0) {
            contextText += '  Routes:\n';
            rt.routes.forEach((route: any) => {
              contextText += `    - Destination: ${route.destinationCidrBlock}\n`;
              contextText += `      Target: ${route.gatewayId}\n`;
              contextText += `      State: ${route.state}\n`;
            });
          }
          
          if (rt.associations && rt.associations.length > 0) {
            contextText += '  Subnet Associations:\n';
            rt.associations.forEach((assoc: any) => {
              contextText += `    - Subnet: ${assoc.subnetId}\n`;
              contextText += `      Main: ${assoc.main}\n`;
              contextText += `      State: ${assoc.state}\n`;
            });
          }
        });
      }
      
      // Add internet gateway details
      if (internetGateways.length > 0) {
        contextText += '\nInternet Gateway Information:\n';
        internetGateways.forEach((igw) => {
          contextText += `- Internet Gateway ID: ${igw.internetGatewayId || 'Unknown'}\n`;
          
          if (igw.attachments && igw.attachments.length > 0) {
            contextText += '  VPC Attachments:\n';
            igw.attachments.forEach((attachment: any) => {
              contextText += `    - VPC: ${attachment.vpcId}\n`;
              contextText += `      State: ${attachment.state}\n`;
            });
          }
        });
      }
      
      // Add network ACL details
      if (networkAcls.length > 0) {
        contextText += '\nNetwork ACL Information:\n';
        networkAcls.forEach((acl) => {
          contextText += `- Network ACL ID: ${acl.networkAclId || 'Unknown'}\n`;
          
          if (acl.entries && acl.entries.length > 0) {
            contextText += '  Rules:\n';
            acl.entries.forEach((entry: any) => {
              contextText += `    - Rule #${entry.ruleNumber}\n`;
              contextText += `      Type: ${entry.egress === 'true' ? 'Egress' : 'Ingress'}\n`;
              contextText += `      Protocol: ${entry.protocol}\n`;
              contextText += `      CIDR: ${entry.cidrBlock}\n`;
              contextText += `      Action: ${entry.ruleAction}\n`;
            });
          }
        });
      }
      
      // Add load balancer details
      if (loadBalancers.length > 0) {
        contextText += '\nLoad Balancer Information:\n';
        loadBalancers.forEach((lb) => {
          contextText += `- Load Balancer: ${lb.loadBalancerArn || 'Unknown'}\n`;
          
          if (lb.properties) {
            if (lb.properties.loadBalancerName) contextText += `  Name: ${lb.properties.loadBalancerName}\n`;
            if (lb.properties.type) contextText += `  Type: ${lb.properties.type}\n`;
            if (lb.properties.scheme) contextText += `  Scheme: ${lb.properties.scheme}\n`;
          }
        });
      }
      
      // Add S3 bucket details
      if (buckets.length > 0) {
        contextText += '\nS3 Bucket Information:\n';
        buckets.forEach((bucket) => {
          contextText += `- Bucket: ${bucket.name || 'Unknown'}\n`;
          
          if (bucket.properties) {
            if (bucket.properties.CreationDate) 
              contextText += `  Created: ${bucket.properties.CreationDate}\n`;
          }
        });
      }
      
      // If no specific resource details were found
      if (vpcs.length === 0 && subnets.length === 0 && instances.length === 0 && 
          securityGroups.length === 0 && routeTables.length === 0 && internetGateways.length === 0 &&
          networkAcls.length === 0 && loadBalancers.length === 0 && buckets.length === 0) {
        contextText += '\nNo detailed resource information available for this AWS environment.';
      }
      
      return contextText;
    } catch (error: any) {
      logger.error('Error formatting cloud resource data:', error);
      return `Error processing cloud resource data: ${error.message || 'Unknown error'}`;
    }
  }
  
  /**
   * Original format method for the old API endpoint structure
   */
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
          contextText += `  Node Type: ${resource.nodeType || 'Unknown'}\n`;
          
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
        contextText += `  Node Type: ${data.network.nodeType || 'Unknown'}\n`;
        
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
        contextText += `  Node Type: ${data.security.nodeType || 'Unknown'}\n`;
        
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