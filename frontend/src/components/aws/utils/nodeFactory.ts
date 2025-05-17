import { AWSNode as AWSNodeType } from '../awsNodes';
import { Z_INDEX, NODE_DIMENSIONS, NODE_TYPES } from './constants';

// Type for AWS node types matching the types from awsNodes.ts
type AWSNodeTypeId = 'vpc' | 'subnet' | 'ec2' | 'security_group' | 's3' | 
                     'route_table' | 'internet_gateway' | 'nat_gateway' | 
                     'network_acl' | 'elastic_ip' | 'transit_gateway' | 
                     'load_balancer' | 'ecs_cluster' | 'ecs_task' | 
                     'lambda_function' | 'iam_role' | 'iam_user' | 
                     'iam_policy' | 'header';

/**
 * Create a VPC node with proper styling
 */
export function createVpcNode(
  id: string,
  label: string,
  vpcId: string,
  cidrBlock: string = '',
  x: number,
  y: number
): AWSNodeType {
  return {
    id,
    type: 'vpc' as AWSNodeTypeId,
    position: { x, y },
    style: {
      width: NODE_DIMENSIONS.VPC.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.VPC.DEFAULT_HEIGHT,
      zIndex: Z_INDEX.CONTAINER,
      backgroundColor: 'rgba(240, 248, 255, 0.5)'  // Light transparent background
    },
    data: {
      label,
      type: 'vpc',
      resourceId: id,
      VpcId: vpcId,
      CidrBlock: cidrBlock
    },
    // Make node fully independent
    draggable: true,         // Allow dragging
    selectable: true,        // Can be selected individually 
    connectable: false,      // Prevent new connections
    parentNode: undefined,   // No parent relationship
    extent: undefined,       // Not constrained to parent
    expandParent: false      // Don't expand parent when this node is moved
  };
}

/**
 * Create a subnet node with proper styling
 */
export function createSubnetNode(
  id: string,
  label: string,
  subnetId: string,
  vpcId: string,
  parentId: string,
  x: number,
  y: number,
  cidrBlock: string = ''
): AWSNodeType {
  return {
    id,
    type: 'subnet' as AWSNodeTypeId,
    position: { x, y },
    parentNode: parentId,
    extent: 'parent',
    style: {
      width: NODE_DIMENSIONS.SUBNET.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.SUBNET.DEFAULT_HEIGHT,
      zIndex: Z_INDEX.CONTAINER + 1
    },
    data: {
      label,
      type: 'subnet',
      resourceId: id,
      parentId,
      SubnetId: subnetId,
      VpcId: vpcId,
      CidrBlock: cidrBlock
    }
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
): AWSNodeType {
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
): AWSNodeType {
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
): AWSNodeType {
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
): AWSNodeType {
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
  parentId: string | undefined,
  x: number,
  y: number
): AWSNodeType {
  return {
    id,
    type: 'header' as AWSNodeTypeId,
    position: { x, y },
    parentId,
    extent: parentId ? 'parent' : undefined,
    hidden: false,
    selectable: false,
    style: { 
      width: NODE_DIMENSIONS.HEADER.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.HEADER.DEFAULT_HEIGHT,
      padding: 0,
      borderWidth: 0,
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
      backgroundColor: 'transparent',
      zIndex: Z_INDEX.HEADER
    },
    data: {
      label,
      type: 'header',
      resourceId: id
    }
  };
}

/**
 * Create a generic resource node for any AWS resource type
 * Note: Additional data should include all required fields for the specific node type
 */
export function createResourceNode(
  id: string,
  label: string,
  resourceType: AWSNodeTypeId,
  resourceId: string,
  parentId: string | undefined,
  x: number,
  y: number,
  additionalData: Record<string, any> = {}
): AWSNodeType {
  return {
    id,
    type: resourceType,
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
      type: resourceType,
      resourceId,
      parentId,
      // Adding default values for common properties to satisfy TypeScript
      // Specific properties should be provided in additionalData
      VpcId: '',
      SubnetId: '',
      GroupId: '',
      RouteTableId: '',
      InternetGatewayId: '',
      NatGatewayId: '',
      NetworkAclId: '',
      PublicIp: '',
      AllocationId: '',
      TransitGatewayId: '',
      LoadBalancerArn: '',
      LoadBalancerName: '',
      ClusterArn: '',
      ClusterName: '',
      TaskArn: '',
      TaskDefinitionArn: '',
      FunctionName: '',
      FunctionArn: '',
      RoleName: '',
      RoleId: '',
      UserName: '',
      UserId: '',
      PolicyName: '',
      PolicyId: '',
      // Override with provided additional data
      ...additionalData
    } as any // Use type assertion as a last resort
  };
} 