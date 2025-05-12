import { ConversionResult } from '../types';
import { createSecurityGroupNode } from '../utils/nodeFactory';
import { createSecurityGroupToResourceEdge } from '../utils/edgeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent
} from './baseProcessor';

/**
 * Processor for AWS Security Group resources
 */
export default class SecurityGroupProcessor implements ResourceProcessor {
  /**
   * Process Security Group resources
   */
  process(
    securityGroups: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    parentId?: string, // Optional parent VPC ID
    associatedResourceId?: string // Resource to attach the security group to
  ): void {
    if (!securityGroups || securityGroups.length === 0) return;
    
    const { nodes, edges } = result;
    
    // Process each security group
    securityGroups.forEach((securityGroup, index) => {
      // Create security group node ID
      const sgId = getResourceId('sg', securityGroup.groupId, generateNodeId);
      
      // Create security group node
      const sgNode = createSecurityGroupNode(
        sgId,
        securityGroup.name || securityGroup.groupName || `Security Group ${index + 1}`,
        securityGroup.groupId || '',
        securityGroup.vpcId || '',
        parentId, // parentNode ID (optional)
        0, 0, // position will be updated by positionNodeInParent if there's a parent
        {
          groupName: securityGroup.groupName || securityGroup.name || '',
          description: securityGroup.description || '',
          inboundRules: securityGroup.inboundRules || [],
          outboundRules: securityGroup.outboundRules || []
        }
      );
      
      // Add security group node to results
      nodes.push(sgNode);
      
      // Position security group relative to its parent (if any)
      if (parentId) {
        positionNodeInParent(sgNode, nodes, parentId);
      }
      
      // If this security group is associated with a specific resource, create an edge
      if (associatedResourceId) {
        edges.push(
          createSecurityGroupToResourceEdge(
            sgId,
            associatedResourceId,
            generateEdgeId
          )
        );
      }
      
      // Process security group references (security group referencing other security groups)
      if (securityGroup.referencedGroups && securityGroup.referencedGroups.length > 0) {
        this.processSecurityGroupReferences(
          securityGroup.referencedGroups,
          sgId,
          result,
          generateEdgeId
        );
      }
    });
  }
  
  /**
   * Process security group references to other security groups
   */
  private processSecurityGroupReferences(
    referencedGroups: string[],
    sourceGroupId: string,
    result: ConversionResult,
    generateEdgeId: () => string
  ): void {
    const { nodes, edges } = result;
    
    // Create edges to referenced security groups that exist in the diagram
    referencedGroups.forEach(refGroupId => {
      // Look for the referenced group in existing nodes
      const targetNode = nodes.find(node => 
        node.data.type === 'security_group' && 
        (node.data.GroupId === refGroupId || node.id === `sg-${refGroupId}`)
      );
      
      if (targetNode) {
        // Create edge between security groups
        edges.push({
          id: generateEdgeId(),
          source: sourceGroupId,
          target: targetNode.id,
          type: 'smoothstep',
          data: {
            type: 'sg-to-sg',
            description: 'Security group reference'
          }
        });
      }
    });
  }
} 