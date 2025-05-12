import { Edge } from 'reactflow';
import { AWSNode, isEC2Node, isVPCNode, isSubnetNode, isSecurityGroupNode, isLoadBalancerNode } from './awsNodes';

// Edge data interface for AWS connections
export interface AWSEdgeData {
  label?: string;
  type: RelationshipType;
  description?: string;
}

// Relationship types
export type RelationshipType = 
  | 'vpc-to-subnet'
  | 'subnet-to-ec2'
  | 'subnet-to-lb'
  | 'subnet-to-rds'
  | 'rt-to-subnet'
  | 'igw-to-vpc'
  | 'natgw-to-vpc'
  | 'sg-to-resource'
  | 'sg-to-sg'
  | 'ec2-to-ebs'
  | 'ec2-to-iam'
  | 'lb-to-ec2'
  | 'lambda-to-apigw'
  | 'lambda-to-event'
  | 'iam-to-resource';

// Define AWSEdge type
export type AWSEdge = Edge<AWSEdgeData>;

// Edge creators for specific relationship types
let edgeIdCounter = 0;
const getNextEdgeId = () => `e-${++edgeIdCounter}`;

// Create a VPC to subnet relationship
export function createVpcToSubnetEdge(vpcNode: AWSNode, subnetNode: AWSNode): AWSEdge | null {
  if (!isVPCNode(vpcNode) || !isSubnetNode(subnetNode)) {
    return null;
  }
  
  return {
    id: getNextEdgeId(),
    source: vpcNode.id,
    target: subnetNode.id,
    type: 'smoothstep',
    data: {
      type: 'vpc-to-subnet',
      description: 'Subnet belongs to VPC'
    }
  };
}

// Create a subnet to EC2 relationship
export function createSubnetToEC2Edge(subnetNode: AWSNode, ec2Node: AWSNode): AWSEdge | null {
  if (!isSubnetNode(subnetNode) || !isEC2Node(ec2Node)) {
    return null;
  }
  
  return {
    id: getNextEdgeId(),
    source: subnetNode.id,
    target: ec2Node.id,
    type: 'smoothstep',
    data: {
      type: 'subnet-to-ec2',
      description: 'EC2 instance in subnet'
    }
  };
}

// Create security group to resource relationship
export function createSecurityGroupToResourceEdge(
  sgNode: AWSNode, 
  resourceNode: AWSNode
): AWSEdge | null {
  if (!isSecurityGroupNode(sgNode)) {
    return null;
  }
  
  return {
    id: getNextEdgeId(),
    source: sgNode.id,
    target: resourceNode.id,
    type: 'smoothstep',
    data: {
      type: 'sg-to-resource',
      description: 'Security group associated with resource'
    }
  };
}

// Create security group to security group relationship
export function createSecurityGroupToSecurityGroupEdge(
  sourceNode: AWSNode, 
  targetNode: AWSNode
): AWSEdge | null {
  if (!isSecurityGroupNode(sourceNode) || !isSecurityGroupNode(targetNode)) {
    return null;
  }
  
  return {
    id: getNextEdgeId(),
    source: sourceNode.id,
    target: targetNode.id,
    type: 'smoothstep',
    data: {
      type: 'sg-to-sg',
      description: 'Security group reference'
    }
  };
}

// Create load balancer to EC2 relationship
export function createLoadBalancerToEC2Edge(
  lbNode: AWSNode, 
  ec2Node: AWSNode
): AWSEdge | null {
  if (!isLoadBalancerNode(lbNode) || !isEC2Node(ec2Node)) {
    return null;
  }
  
  return {
    id: getNextEdgeId(),
    source: lbNode.id,
    target: ec2Node.id,
    type: 'smoothstep',
    data: {
      type: 'lb-to-ec2',
      description: 'Load balancer target'
    }
  };
}

// Generic relationship creator
export function createRelationship(
  sourceNode: AWSNode,
  targetNode: AWSNode,
  type: RelationshipType,
  description: string
): AWSEdge {
  return {
    id: getNextEdgeId(),
    source: sourceNode.id,
    target: targetNode.id,
    type: 'smoothstep',
    data: {
      type,
      description
    }
  };
}

// Sample initial edges for VPC → Subnet → EC2 connections
export const initialEdges: AWSEdge[] = [
  // VPC to Subnet connection
  {
    id: 'e-vpc1-subnet1',
    source: 'vpc-1',
    target: 'subnet-1',
    data: {
      type: 'vpc-to-subnet',
      description: 'Subnet belongs to VPC'
    }
  },
  
  // Subnet to EC2 connection
  {
    id: 'e-subnet1-ec2-1',
    source: 'subnet-1',
    target: 'ec2-1',
    data: {
      type: 'subnet-to-ec2',
      description: 'EC2 instance in subnet'
    }
  }
]; 