import { ConversionResult } from '../types';
import { createSubnetNode } from '../utils/nodeFactory';
import { createVpcToSubnetEdge } from '../utils/edgeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent,
  createResourceRelationship, 
  updateContainerDimensions 
} from './baseProcessor';
import EC2Processor from './ec2Processor';

/**
 * Processor for AWS Subnet resources
 */
export default class SubnetProcessor implements ResourceProcessor {
  private ec2Processor: EC2Processor;
  
  constructor() {
    this.ec2Processor = new EC2Processor();
  }
  
  /**
   * Process subnet resources
   */
  process(
    subnets: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    vpcId?: string
  ): void {
    if (!subnets || subnets.length === 0) return;
    
    const { nodes, edges } = result;
    const subnetIds: string[] = [];
    
    // Process each subnet
    subnets.forEach((subnet, index) => {
      // Create subnet node ID
      const subnetId = getResourceId('subnet', subnet.subnetId, generateNodeId);
      subnetIds.push(subnetId);
      
      // Create initial subnet node at position 0,0 - will be positioned later
      const subnetNode = createSubnetNode(
        subnetId,
        subnet.name || `Subnet ${subnet.subnetId || index + 1}`,
        subnet.subnetId || '',
        subnet.vpcId || (vpcId ? vpcId.replace('vpc-', '') : ''),
        vpcId || '', // parentNode ID
        0, 0, // position will be updated by positionNodeInParent
        subnet.cidrBlock || ''
      );
      
      // Add subnet node to results
      nodes.push(subnetNode);
      
      // Position subnet relative to its parent VPC
      if (vpcId) {
        positionNodeInParent(subnetNode, nodes, vpcId);
        
        // Create edge from VPC to subnet
        edges.push(
          createVpcToSubnetEdge(
            vpcId,
            subnetId,
            generateEdgeId
          )
        );
      }
      
      // Process EC2 instances within this subnet
      if (subnet.instances && subnet.instances.length > 0) {
        this.ec2Processor.process(
          subnet.instances,
          result,
          generateNodeId,
          generateEdgeId,
          subnetId
        );
      }
      
      // Process other resources in subnet if needed
      // This is where you would add processors for RDS, ElastiCache, etc.
    });
    
    // Update subnet dimensions after all children are added
    updateContainerDimensions(nodes, subnetIds);
  }
} 