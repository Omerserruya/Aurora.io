import { AWSEdge, RelationshipType } from '../awsEdges';
import { AWSNode as AWSNodeType } from '../awsNodes';
import { EDGE_TYPES } from './constants';

/**
 * Create a relationship between AWS resources
 */
export function createRelationship(
  sourceId: string,
  targetId: string,
  type: RelationshipType,
  description: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return {
    id: edgeIdGenerator(),
    source: sourceId,
    target: targetId,
    type: 'smoothstep',
    data: {
      type,
      description
    }
  };
}

/**
 * Create a VPC to subnet relationship
 */
export function createVpcToSubnetEdge(
  vpcId: string,
  subnetId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    vpcId,
    subnetId,
    'vpc-to-subnet',
    'Subnet belongs to VPC',
    edgeIdGenerator
  );
}

/**
 * Create a subnet to EC2 relationship
 */
export function createSubnetToEc2Edge(
  subnetId: string,
  ec2Id: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    subnetId,
    ec2Id,
    'subnet-to-ec2',
    'EC2 instance in subnet',
    edgeIdGenerator
  );
}

/**
 * Create a subnet to load balancer relationship
 */
export function createSubnetToLbEdge(
  subnetId: string,
  lbId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    subnetId,
    lbId,
    'subnet-to-lb',
    'Load balancer in subnet',
    edgeIdGenerator
  );
}

/**
 * Create a security group to resource relationship
 */
export function createSecurityGroupToResourceEdge(
  sgId: string,
  resourceId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    sgId,
    resourceId,
    'sg-to-resource',
    'Security group protecting resource',
    edgeIdGenerator
  );
}

/**
 * Create a route table to subnet relationship
 */
export function createRouteTableToSubnetEdge(
  routeTableId: string,
  subnetId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    routeTableId,
    subnetId,
    'rt-to-subnet',
    'Route table associated with subnet',
    edgeIdGenerator
  );
}

/**
 * Create an internet gateway to VPC relationship
 */
export function createIgwToVpcEdge(
  igwId: string,
  vpcId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    igwId,
    vpcId,
    'igw-to-vpc',
    'Internet gateway attached to VPC',
    edgeIdGenerator
  );
}

/**
 * Create a NAT gateway to VPC relationship
 */
export function createNatGwToVpcEdge(
  natGwId: string,
  vpcId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    natGwId,
    vpcId,
    'natgw-to-vpc',
    'NAT gateway in VPC',
    edgeIdGenerator
  );
}

/**
 * Create a load balancer to EC2 relationship
 */
export function createLbToEc2Edge(
  lbId: string,
  ec2Id: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    lbId,
    ec2Id,
    'lb-to-ec2',
    'Load balancer target',
    edgeIdGenerator
  );
}

/**
 * Create a Lambda to API Gateway relationship
 */
export function createLambdaToApiGwEdge(
  lambdaId: string,
  apiGwId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    lambdaId,
    apiGwId,
    'lambda-to-apigw',
    'Lambda integrated with API Gateway',
    edgeIdGenerator
  );
}

/**
 * Create an IAM role to resource relationship
 */
export function createIamToResourceEdge(
  iamId: string,
  resourceId: string,
  edgeIdGenerator: () => string
): AWSEdge {
  return createRelationship(
    iamId,
    resourceId,
    'iam-to-resource',
    'IAM role assigned to resource',
    edgeIdGenerator
  );
}

/**
 * Edge ID generator
 */
let edgeIdCounter = 0;
export const generateEdgeId = () => `e-${++edgeIdCounter}`;

/**
 * Reset edge ID counter
 */
export function resetEdgeIdCounter() {
  edgeIdCounter = 0;
}

/**
 * Create an edge based on resource types
 * This is a more generic function that determines the edge type based on source and target types
 */
export function createEdgeByResourceTypes(
  sourceNode: AWSNodeType,
  targetNode: AWSNodeType,
  edgeIdGenerator: () => string
): AWSEdge | null {
  const sourceType = sourceNode.data.type;
  const targetType = targetNode.data.type;
  
  // Determine edge type based on source and target types
  if (sourceType === 'vpc' && targetType === 'subnet') {
    return createVpcToSubnetEdge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  if (sourceType === 'subnet' && targetType === 'ec2') {
    return createSubnetToEc2Edge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  if (sourceType === 'subnet' && targetType === 'load_balancer') {
    return createSubnetToLbEdge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  if (sourceType === 'security_group') {
    return createSecurityGroupToResourceEdge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  if (sourceType === 'route_table' && targetType === 'subnet') {
    return createRouteTableToSubnetEdge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  if (sourceType === 'internet_gateway' && targetType === 'vpc') {
    return createIgwToVpcEdge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  if (sourceType === 'nat_gateway' && targetType === 'vpc') {
    return createNatGwToVpcEdge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  if (sourceType === 'load_balancer' && targetType === 'ec2') {
    return createLbToEc2Edge(sourceNode.id, targetNode.id, edgeIdGenerator);
  }
  
  // Default case - no recognized relationship
  return null;
} 