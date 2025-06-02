import { ConversionResult } from '../types';
import { createEc2Node } from '../utils/nodeFactory';
import { createSubnetToEc2Edge, createSecurityGroupToResourceEdge } from '../utils/edgeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent
} from './baseProcessor';

/**
 * Processor for AWS EC2 Instance resources
 */
export default class EC2Processor implements ResourceProcessor {
  /**
   * Process EC2 instance resources
   */
  process(
    instances: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    parentId?: string // parent subnet ID
  ): void {
    if (!instances || instances.length === 0) return;
    
    const { nodes, edges } = result;
    
    // Process each EC2 instance
    instances.forEach((instance, index) => {
      // Create EC2 node ID
      const ec2Id = getResourceId('ec2', instance.instanceId, generateNodeId);
      
      // Create initial EC2 node at position 0,0 - will be positioned later
      const ec2Node = createEc2Node(
        ec2Id,
        instance.name || `EC2 ${instance.instanceId || index + 1}`,
        instance.instanceId || '',
        parentId || '',
        0, 0, // position will be updated by positionNodeInParent
        {
          instanceType: instance.instanceType || '',
          vpcId: instance.vpcId || '',
          subnetId: instance.subnetId || '',
          imageId: instance.imageId || '',
          image: instance.image || ''
        }
      );
      
      // Add EC2 node to results
      nodes.push(ec2Node);
      
      // Position EC2 instance relative to its parent subnet
      if (parentId) {
        positionNodeInParent(ec2Node, nodes, parentId);
        
        // Create edge from subnet to EC2
        edges.push(
          createSubnetToEc2Edge(
            parentId,
            ec2Id,
            generateEdgeId
          )
        );
      }
      
      // Process security groups if any
      if (instance.securityGroups && instance.securityGroups.length > 0) {
        this.processSecurityGroups(
          instance.securityGroups,
          ec2Id,
          result,
          generateNodeId,
          generateEdgeId
        );
      }
    });
  }
  
  /**
   * Associate security groups with EC2 instances
   */
  private processSecurityGroups(
    securityGroups: any[],
    ec2Id: string,
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void {
    const { nodes, edges } = result;
    
    // Process each security group reference
    securityGroups.forEach(securityGroup => {
      let sgId: string | null = null;
      
      // Security group can be an object with details or just an ID string
      if (typeof securityGroup === 'string') {
        sgId = `sg-${securityGroup}`;
      } else {
        // Get the security group ID from the object
        const groupId = securityGroup.groupId || securityGroup.GroupId;
        sgId = groupId ? `sg-${groupId}` : null;
      }
      
      if (sgId) {
        // Check if this security group node already exists
        const existingSgNode = nodes.find(node => {
          // Check direct ID match
          if (node.id === sgId) return true;
          
          // Check if it's a security group type
          if (node.data?.type === 'security_group') {
            // Type-safe way to access GroupId
            const sgData = node.data as any;
            return sgData.GroupId && `sg-${sgData.GroupId}` === sgId;
          }
          
          return false;
        });
        
        if (existingSgNode) {
          // Create edge from security group to EC2 instance
          edges.push(
            createSecurityGroupToResourceEdge(
              existingSgNode.id,
              ec2Id,
              generateEdgeId
            )
          );
        }
      }
    });
  }
} 