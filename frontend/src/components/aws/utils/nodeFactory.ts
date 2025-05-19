import { AWSNode, AWSNodeData } from '../awsNodes';
import { Z_INDEX, NODE_DIMENSIONS, NODE_TYPES } from './constants';

// Type for AWS node types matching the types from awsNodes.ts
type AWSNodeTypeId = 'vpc' | 'subnet' | 'ec2' | 'security_group' | 's3' | 
                     'route_table' | 'internet_gateway' | 'nat_gateway' | 
                     'network_acl' | 'elastic_ip' | 'transit_gateway' | 
                     'load_balancer' | 'ecs_cluster' | 'ecs_task' | 
                     'lambda_function' | 'iam_role' | 'iam_user' | 
                     'iam_policy' | 'header';

/**
 * Create a VPC container node
 */
export function createVpcNode(
  id: string,
  label: string,
  vpcId: string,
  cidrBlock: string,
  x: number,
  y: number
): AWSNode {
  return {
    id,
    type: 'vpc',
    position: { x, y },
    data: {
      label,
      type: 'vpc',
      resourceId: vpcId,
      VpcId: vpcId,
      CidrBlock: cidrBlock
    },
    style: {
      width: NODE_DIMENSIONS.VPC.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.VPC.DEFAULT_HEIGHT
    },
    draggable: true
  };
}

/**
 * Create a subnet container node
 */
export function createSubnetNode(
  id: string,
  label: string,
  subnetId: string,
  vpcId: string,
  parentId: string,
  x: number,
  y: number,
  cidrBlock: string
): AWSNode {
  return {
    id,
    type: 'subnet',
    position: { x, y },
    data: {
      label,
      type: 'subnet',
      resourceId: subnetId,
      SubnetId: subnetId,
      VpcId: vpcId,
      CidrBlock: cidrBlock
    },
    parentNode: parentId,
    extent: 'parent',
    style: {
      width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT
    },
    draggable: true
  };
}

/**
 * Create an EC2 instance node
 */
export function createEc2Node(
  id: string,
  label: string,
  instanceId: string,
  parentId: string,
  x: number,
  y: number,
  props: {
    instanceType?: string,
    vpcId?: string,
    subnetId?: string,
    imageId?: string,
    image?: string
  } = {}
): AWSNode {
  return {
    id,
    type: 'ec2' as AWSNodeTypeId,
    position: { x, y },
    parentNode: parentId,
    extent: 'parent',
    style: { 
      width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH, 
      height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT,
      zIndex: Z_INDEX.RESOURCE
    },
    data: {
      label,
      type: 'ec2',
      resourceId: id,
      parentId,
      InstanceId: instanceId,
      InstanceType: props.instanceType || 'Unknown',
      VpcId: props.vpcId || '',
      SubnetId: props.subnetId || '',
      ImageId: props.imageId || '',
      Image: props.image || ''
    }
  };
}

/**
 * Create a security group node
 */
export function createSecurityGroupNode(
  id: string,
  label: string,
  groupId: string,
  vpcId: string,
  parentId: string | undefined,
  x: number,
  y: number,
  props: {
    groupName?: string,
    description?: string,
    inboundRules?: any[],
    outboundRules?: any[]
  } = {}
): AWSNode {
  return {
    id,
    type: 'security_group' as AWSNodeTypeId,
    position: { x, y },
    parentNode: parentId,
    extent: parentId ? 'parent' : undefined,
    style: { 
      width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH, 
      height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT,
      zIndex: Z_INDEX.RESOURCE
    },
    data: {
      label,
      type: 'security_group',
      resourceId: id,
      parentId,
      GroupId: groupId,
      GroupName: props.groupName || '',
      VpcId: vpcId,
      Description: props.description || '',
      InboundRules: props.inboundRules || [],
      OutboundRules: props.outboundRules || []
    }
  };
}

/**
 * Create a route table node
 */
export function createRouteTableNode(
  id: string,
  label: string,
  routeTableId: string,
  vpcId: string,
  parentId: string | undefined,
  x: number,
  y: number,
  props: {
    routes?: any[],
    associations?: any[]
  } = {}
): AWSNode {
  return {
    id,
    type: 'route_table' as AWSNodeTypeId,
    position: { x, y },
    parentNode: parentId,
    extent: parentId ? 'parent' : undefined,
    style: { 
      width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH, 
      height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT,
      zIndex: Z_INDEX.RESOURCE
    },
    data: {
      label,
      type: 'route_table',
      resourceId: id,
      parentId,
      RouteTableId: routeTableId,
      VpcId: vpcId,
      Routes: props.routes || [],
      Associations: props.associations || []
    }
  };
}

/**
 * Create an internet gateway node
 */
export function createInternetGatewayNode(
  id: string,
  label: string,
  igwId: string,
  parentId: string | undefined,
  x: number,
  y: number,
  props: {
    attachments?: any[]
  } = {}
): AWSNode {
  return {
    id,
    type: 'internet_gateway' as AWSNodeTypeId,
    position: { x, y },
    parentNode: parentId,
    extent: parentId ? 'parent' : undefined,
    style: { 
      width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH, 
      height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT,
      zIndex: Z_INDEX.RESOURCE
    },
    data: {
      label,
      type: 'internet_gateway',
      resourceId: id,
      parentId,
      InternetGatewayId: igwId,
      Attachments: props.attachments || []
    }
  };
}

/**
 * Create a section header node
 */
export function createHeaderNode(
  id: string,
  label: string,
  x: number,
  y: number
): AWSNode {
  return {
    id,
    type: 'header',
    position: { x, y },
    data: {
      label,
      type: 'header',
      resourceId: id
    },
    style: {
      width: NODE_DIMENSIONS.HEADER.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.HEADER.DEFAULT_HEIGHT
    },
    draggable: false
  };
}

/**
 * Create a generic resource node for any AWS resource type
 * Note: Additional data should include all required fields for the specific node type
 */
export function createResourceNode(
  id: string,
  label: string,
  type: string,
  resourceId: string,
  parentId: string | undefined,
  x: number,
  y: number,
  properties: Record<string, any> = {}
): AWSNode {
  return {
    id,
    type,
    position: { x, y },
    data: {
      label,
      type,
      resourceId,
      ...properties
    },
    ...(parentId ? { parentNode: parentId, extent: 'parent' } : {}),
    style: {
      width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT
    },
    draggable: true
  };
} 