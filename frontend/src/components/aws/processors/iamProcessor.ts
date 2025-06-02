import { ConversionResult } from '../types';
import { createResourceNode } from '../utils/nodeFactory';
import { createIamToResourceEdge } from '../utils/edgeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent,
  createGlobalResourcesContainer,
  updateContainerDimensions
} from './baseProcessor';
import { NODE_TYPES } from '../constants';
import { AWSNode } from '../awsNodes';

/**
 * Processor for AWS IAM resources
 */
export default class IAMProcessor implements ResourceProcessor {
  /**
   * Process IAM resources
   */
  process(
    iamResources: {
      roles?: any[],
      users?: any[],
      policies?: any[]
    },
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    x: number = 50, // Default x position for global resources
    y: number = 50 // Default y position for global resources
  ): void {
    // Create a container for IAM resources
    const containerId = createGlobalResourcesContainer(
      result,
      generateNodeId,
      'IAM Resources',
      x,
      y + 750 // Position below other global resources
    );
    
    // Process IAM roles
    if (iamResources.roles && iamResources.roles.length > 0) {
      this.processIAMRoles(
        iamResources.roles,
        result,
        generateNodeId,
        generateEdgeId,
        containerId
      );
    }
    
    // Process IAM users
    if (iamResources.users && iamResources.users.length > 0) {
      this.processIAMUsers(
        iamResources.users,
        result,
        generateNodeId,
        generateEdgeId,
        containerId
      );
    }
    
    // Process IAM policies
    if (iamResources.policies && iamResources.policies.length > 0) {
      this.processIAMPolicies(
        iamResources.policies,
        result,
        generateNodeId,
        generateEdgeId,
        containerId
      );
    }
    
    // Update container dimensions to fit all IAM resources
    updateContainerDimensions(result.nodes, [containerId]);
  }
  
  /**
   * Process IAM roles
   */
  private processIAMRoles(
    roles: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    containerId: string
  ): void {
    const { nodes, edges } = result;
    
    // Process each IAM role
    roles.forEach((role, index) => {
      // Create IAM role node ID
      const roleId = getResourceId('role', role.roleName, generateNodeId);
      
      // Create IAM role node with explicit parent relationship
      const roleNode: AWSNode = {
        id: roleId,
        type: NODE_TYPES.IAM_ROLE,
        position: { x: 0, y: 0 }, // Will be positioned by positionNodeInParent
        data: {
          label: role.roleName || `IAM Role ${index + 1}`,
          type: NODE_TYPES.IAM_ROLE,
          resourceId: roleId,
          RoleName: role.roleName || '',
          RoleId: role.roleId || '',
          AssumeRolePolicyDocument: role.assumeRolePolicyDocument || {}
        },
        parentNode: containerId,
        extent: 'parent' as const,
        style: {
          width: 200,
          height: 100
        }
      };
      
      // Add IAM role node to results
      nodes.push(roleNode);
      
      // Position the role within the container
      positionNodeInParent(roleNode, nodes, containerId);
      
      // Process attached resources if any
      if (role.attachedResources && role.attachedResources.length > 0) {
        role.attachedResources.forEach((resourceId: string) => {
          edges.push(
            createIamToResourceEdge(
              roleId,
              resourceId,
              generateEdgeId
            )
          );
        });
      }
    });
  }
  
  /**
   * Process IAM users
   */
  private processIAMUsers(
    users: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    containerId: string
  ): void {
    const { nodes } = result;
    
    // Process each IAM user
    users.forEach((user, index) => {
      // Create IAM user node ID
      const userId = getResourceId('user', user.userName, generateNodeId);
      
      // Create IAM user node with explicit parent relationship
      const userNode: AWSNode = {
        id: userId,
        type: NODE_TYPES.IAM_USER,
        position: { x: 0, y: 0 }, // Will be positioned by positionNodeInParent
        data: {
          label: user.userName || `IAM User ${index + 1}`,
          type: NODE_TYPES.IAM_USER,
          resourceId: userId,
          UserName: user.userName || '',
          UserId: user.userId || '',
          Arn: user.arn || ''
        },
        parentNode: containerId,
        extent: 'parent' as const,
        style: {
          width: 200,
          height: 100
        }
      };
      
      // Add IAM user node to results
      nodes.push(userNode);
      
      // Position the user within the container
      positionNodeInParent(userNode, nodes, containerId);
    });
  }
  
  /**
   * Process IAM policies
   */
  private processIAMPolicies(
    policies: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    containerId: string
  ): void {
    const { nodes } = result;
    
    // Process each IAM policy
    policies.forEach((policy, index) => {
      // Create IAM policy node ID
      const policyId = getResourceId('policy', policy.policyName, generateNodeId);
      
      // Create IAM policy node with explicit parent relationship
      const policyNode: AWSNode = {
        id: policyId,
        type: NODE_TYPES.IAM_POLICY,
        position: { x: 0, y: 0 }, // Will be positioned by positionNodeInParent
        data: {
          label: policy.policyName || `IAM Policy ${index + 1}`,
          type: NODE_TYPES.IAM_POLICY,
          resourceId: policyId,
          PolicyName: policy.policyName || '',
          PolicyId: policy.policyId || '',
          AttachmentCount: policy.attachmentCount || 0
        },
        parentNode: containerId,
        extent: 'parent' as const,
        style: {
          width: 200,
          height: 100
        }
      };
      
      // Add IAM policy node to results
      nodes.push(policyNode);
      
      // Position the policy within the container
      positionNodeInParent(policyNode, nodes, containerId);
    });
  }
} 