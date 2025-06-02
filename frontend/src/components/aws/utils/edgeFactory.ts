import { AWSEdge, AWSEdgeData } from '../awsEdges';
import { RelationshipType } from '../types';

// Counter for generating unique edge IDs
let edgeIdCounter = 0;

/**
 * Generate a unique edge ID
 */
export function generateEdgeId(): string {
  return `e-${++edgeIdCounter}`;
}

/**
 * Reset edge ID counter
 */
export function resetEdgeIdCounter(): void {
  edgeIdCounter = 0;
}

/**
 * Create a relationship edge between resources
 */
export function createRelationshipEdge(
  source: string,
  target: string,
  type: RelationshipType,
  description?: string
): AWSEdge {
  return {
    id: generateEdgeId(),
    source,
    target,
    type: 'smoothstep',
    animated: type === RelationshipType.IAM_TO_RESOURCE || type === RelationshipType.LAMBDA_TO_OTHER,
    style: {
      strokeWidth: 2
    },
    data: {
      type,
      description: description || getDefaultDescription(type)
    }
  };
}

/**
 * Create a relationship - alias for createRelationshipEdge
 */
export function createRelationship(
  source: string,
  target: string,
  type: RelationshipType,
  description?: string,
  generateId?: () => string
): AWSEdge {
  return {
    id: generateId ? generateId() : generateEdgeId(),
    source,
    target,
    type: 'smoothstep',
    animated: type === RelationshipType.IAM_TO_RESOURCE || type === RelationshipType.LAMBDA_TO_OTHER,
    style: {
      strokeWidth: 2
    },
    data: {
      type,
      description: description || getDefaultDescription(type)
    }
  };
}

/**
 * Create VPC to Subnet edge
 */
export function createVpcToSubnetEdge(
  vpcId: string,
  subnetId: string,
  generateEdgeId: () => string
): AWSEdge {
  return createRelationship(
    vpcId,
    subnetId,
    RelationshipType.VPC_TO_SUBNET,
    'Subnet is in VPC',
    generateEdgeId
  );
}

/**
 * Create Subnet to EC2 edge
 */
export function createSubnetToEc2Edge(
  subnetId: string,
  ec2Id: string,
  generateEdgeId: () => string
): AWSEdge {
  return createRelationship(
    subnetId,
    ec2Id,
    RelationshipType.SUBNET_TO_EC2,
    'Instance is in Subnet',
    generateEdgeId
  );
}

/**
 * Create Security Group to Resource edge
 */
export function createSecurityGroupToResourceEdge(
  sgId: string,
  resourceId: string,
  generateEdgeId: () => string
): AWSEdge {
  return createRelationship(
    sgId,
    resourceId,
    RelationshipType.SG_TO_RESOURCE,
    'Security Group attached to resource',
    generateEdgeId
  );
}

/**
 * Create Internet Gateway to VPC edge
 */
export function createIgwToVpcEdge(
  igwId: string,
  vpcId: string,
  generateEdgeId: () => string
): AWSEdge {
  return createRelationship(
    igwId,
    vpcId,
    RelationshipType.IGW_TO_VPC,
    'Internet Gateway attached to VPC',
    generateEdgeId
  );
}

/**
 * Create IAM Role/User/Policy to Resource edge
 */
export function createIamToResourceEdge(
  iamId: string,
  resourceId: string,
  generateEdgeId: () => string
): AWSEdge {
  return createRelationship(
    iamId,
    resourceId,
    RelationshipType.IAM_TO_RESOURCE,
    'IAM Role attached to resource',
    generateEdgeId
  );
}

/**
 * Create Lambda to API Gateway edge
 */
export function createLambdaToApiGwEdge(
  lambdaId: string,
  apiGwId: string,
  generateEdgeId: () => string
): AWSEdge {
  return createRelationship(
    lambdaId,
    apiGwId,
    RelationshipType.LAMBDA_TO_OTHER,
    'Lambda integrated with API Gateway',
    generateEdgeId
  );
}

/**
 * Get default description for a relationship type
 */
function getDefaultDescription(type: RelationshipType): string {
  switch (type) {
    case RelationshipType.VPC_TO_SUBNET:
      return 'Subnet is in VPC';
    case RelationshipType.SUBNET_TO_EC2:
      return 'Instance is in Subnet';
    case RelationshipType.SG_TO_RESOURCE:
      return 'Security Group attached to resource';
    case RelationshipType.RT_TO_SUBNET:
      return 'Route Table associated with Subnet';
    case RelationshipType.IGW_TO_VPC:
      return 'Internet Gateway attached to VPC';
    case RelationshipType.NATGW_TO_VPC:
      return 'NAT Gateway in VPC';
    case RelationshipType.LB_TO_EC2:
      return 'Load Balancer routes to Instance';
    case RelationshipType.IAM_TO_RESOURCE:
      return 'IAM Role attached to resource';
    case RelationshipType.LAMBDA_TO_OTHER:
      return 'Lambda integrated with resource';
    case RelationshipType.RESOURCE_TO_RESOURCE:
      return 'Resource relationship';
    default:
      return 'Connected to';
  }
} 