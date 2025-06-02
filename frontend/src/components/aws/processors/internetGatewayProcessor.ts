import { ConversionResult } from '../types';
import { createInternetGatewayNode } from '../utils/nodeFactory';
import { createIgwToVpcEdge } from '../utils/edgeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent
} from './baseProcessor';

/**
 * Processor for AWS Internet Gateway resources
 */
export default class InternetGatewayProcessor implements ResourceProcessor {
  /**
   * Process Internet Gateway resources
   */
  process(
    gateways: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    vpcId?: string // VPC to attach the IGW to
  ): void {
    if (!gateways || gateways.length === 0) return;
    
    const { nodes, edges } = result;
    
    // Process each Internet Gateway
    gateways.forEach((gateway, index) => {
      // Create Internet Gateway node ID
      const igwId = getResourceId('igw', gateway.internetGatewayId, generateNodeId);
      
      // Create Internet Gateway node
      const igwNode = createInternetGatewayNode(
        igwId,
        gateway.name || `Internet Gateway ${index + 1}`,
        gateway.internetGatewayId || '',
        vpcId, // parentNode ID (optional)
        0, 0, // position will be updated by positionNodeInParent if there's a parent
        {
          attachments: gateway.attachments || []
        }
      );
      
      // Add Internet Gateway node to results
      nodes.push(igwNode);
      
      // Position Internet Gateway relative to its parent (if any)
      if (vpcId) {
        positionNodeInParent(igwNode, nodes, vpcId);
        
        // Create edge from IGW to VPC
        edges.push(
          createIgwToVpcEdge(
            igwId,
            vpcId,
            generateEdgeId
          )
        );
      }
    });
  }
} 