import { Node } from 'reactflow';

// Base AWS resource node type
export interface AWSNodeData {
  label: string;
  type: string;
  resourceId: string;
  parentId?: string;
}

// Header node for sections
export interface HeaderNodeData extends AWSNodeData {
  type: 'header';
}

// EC2 Instance Node
export interface EC2NodeData extends AWSNodeData {
  type: 'ec2';
  InstanceId: string;
  InstanceType: string;
  VpcId: string;
  SubnetId: string;
  ImageId: string;
  Image: string;
}

// VPC Node
export interface VPCNodeData extends AWSNodeData {
  type: 'vpc';
  VpcId: string;
  CidrBlock: string;
}

// Subnet Node
export interface SubnetNodeData extends AWSNodeData {
  type: 'subnet';
  SubnetId: string;
  VpcId: string;
  CidrBlock: string;
}

// Security Group Node
export interface SecurityGroupNodeData extends AWSNodeData {
  type: 'security_group';
  GroupId: string;
  GroupName: string;
  VpcId: string;
  Description: string;
  InboundRules: any[];
  OutboundRules: any[];
}

// S3 Bucket Node
export interface S3NodeData extends AWSNodeData {
  type: 's3';
  Name: string;
  CreationDate: string;
}

// Route Table Node
export interface RouteTableNodeData extends AWSNodeData {
  type: 'route_table';
  RouteTableId: string;
  VpcId: string;
  Routes: any[];
  Associations: any[];
}

// Internet Gateway Node
export interface InternetGatewayNodeData extends AWSNodeData {
  type: 'internet_gateway';
  InternetGatewayId: string;
  Attachments: any[];
}

// NAT Gateway Node
export interface NatGatewayNodeData extends AWSNodeData {
  type: 'nat_gateway';
  NatGatewayId: string;
  SubnetId: string;
  VpcId: string;
}

// Network ACL Node
export interface NetworkACLNodeData extends AWSNodeData {
  type: 'network_acl';
  NetworkAclId: string;
  VpcId: string;
  Entries: any[];
}

// Elastic IP Node
export interface ElasticIPNodeData extends AWSNodeData {
  type: 'elastic_ip';
  PublicIp: string;
  AllocationId: string;
  InstanceId?: string;
  NetworkInterfaceId?: string;
}

// Transit Gateway Node
export interface TransitGatewayNodeData extends AWSNodeData {
  type: 'transit_gateway';
  TransitGatewayId: string;
  State: string;
  Options: any;
}

// Load Balancer Node
export interface LoadBalancerNodeData extends AWSNodeData {
  type: 'load_balancer';
  LoadBalancerArn: string;
  LoadBalancerName: string;
  VpcId: string;
  Type: string;
  Scheme: string;
}

// ECS Cluster Node
export interface ECSClusterNodeData extends AWSNodeData {
  type: 'ecs_cluster';
  ClusterArn: string;
  ClusterName: string;
  Status: string;
}

// ECS Task Node
export interface ECSTaskNodeData extends AWSNodeData {
  type: 'ecs_task';
  TaskArn: string;
  ClusterArn: string;
  TaskDefinitionArn: string;
  LastStatus: string;
}

// Lambda Function Node
export interface LambdaFunctionNodeData extends AWSNodeData {
  type: 'lambda_function';
  FunctionName: string;
  FunctionArn: string;
  Runtime: string;
  VpcConfig: any;
}

// IAM Role Node
export interface IAMRoleNodeData extends AWSNodeData {
  type: 'iam_role';
  RoleName: string;
  RoleId: string;
  AssumeRolePolicyDocument: any;
}

// IAM User Node
export interface IAMUserNodeData extends AWSNodeData {
  type: 'iam_user';
  UserName: string;
  UserId: string;
  CreateDate: string;
}

// IAM Policy Node
export interface IAMPolicyNodeData extends AWSNodeData {
  type: 'iam_policy';
  PolicyName: string;
  PolicyId: string;
  AttachmentCount: number;
}

// Union type for all AWS node data types
export type AWSNodeDataTypes =
  | HeaderNodeData
  | EC2NodeData
  | VPCNodeData
  | SubnetNodeData
  | SecurityGroupNodeData
  | S3NodeData
  | RouteTableNodeData
  | InternetGatewayNodeData
  | NatGatewayNodeData
  | NetworkACLNodeData
  | ElasticIPNodeData
  | TransitGatewayNodeData
  | LoadBalancerNodeData
  | ECSClusterNodeData
  | ECSTaskNodeData
  | LambdaFunctionNodeData
  | IAMRoleNodeData
  | IAMUserNodeData
  | IAMPolicyNodeData;

// Create a type that conforms to ReactFlow's Node type with our data
export type AWSNode = Node<AWSNodeDataTypes>;

// Type guards for specific AWS node types
export function isEC2Node(node: AWSNode): node is AWSNode & { data: EC2NodeData } {
  return node.data.type === 'ec2';
}

export function isVPCNode(node: AWSNode): node is AWSNode & { data: VPCNodeData } {
  return node.data.type === 'vpc';
}

export function isSubnetNode(node: AWSNode): node is AWSNode & { data: SubnetNodeData } {
  return node.data.type === 'subnet';
}

export function isSecurityGroupNode(node: AWSNode): node is AWSNode & { data: SecurityGroupNodeData } {
  return node.data.type === 'security_group';
}

export function isS3Node(node: AWSNode): node is AWSNode & { data: S3NodeData } {
  return node.data.type === 's3';
}

export function isRouteTableNode(node: AWSNode): node is AWSNode & { data: RouteTableNodeData } {
  return node.data.type === 'route_table';
}

export function isInternetGatewayNode(node: AWSNode): node is AWSNode & { data: InternetGatewayNodeData } {
  return node.data.type === 'internet_gateway';
}

export function isNatGatewayNode(node: AWSNode): node is AWSNode & { data: NatGatewayNodeData } {
  return node.data.type === 'nat_gateway';
}

export function isNetworkACLNode(node: AWSNode): node is AWSNode & { data: NetworkACLNodeData } {
  return node.data.type === 'network_acl';
}

export function isElasticIPNode(node: AWSNode): node is AWSNode & { data: ElasticIPNodeData } {
  return node.data.type === 'elastic_ip';
}

export function isTransitGatewayNode(node: AWSNode): node is AWSNode & { data: TransitGatewayNodeData } {
  return node.data.type === 'transit_gateway';
}

export function isLoadBalancerNode(node: AWSNode): node is AWSNode & { data: LoadBalancerNodeData } {
  return node.data.type === 'load_balancer';
}

export function isECSClusterNode(node: AWSNode): node is AWSNode & { data: ECSClusterNodeData } {
  return node.data.type === 'ecs_cluster';
}

export function isECSTaskNode(node: AWSNode): node is AWSNode & { data: ECSTaskNodeData } {
  return node.data.type === 'ecs_task';
}

export function isLambdaFunctionNode(node: AWSNode): node is AWSNode & { data: LambdaFunctionNodeData } {
  return node.data.type === 'lambda_function';
}

export function isIAMRoleNode(node: AWSNode): node is AWSNode & { data: IAMRoleNodeData } {
  return node.data.type === 'iam_role';
}

export function isIAMUserNode(node: AWSNode): node is AWSNode & { data: IAMUserNodeData } {
  return node.data.type === 'iam_user';
}

export function isIAMPolicyNode(node: AWSNode): node is AWSNode & { data: IAMPolicyNodeData } {
  return node.data.type === 'iam_policy';
}

// Sample initial nodes for a VPC → Subnet → EC2 hierarchy
export const initialNodes: AWSNode[] = [
  // VPC
  {
    id: 'vpc-1',
    type: 'vpc',
    position: { x: 100, y: 100 },
    style: { width: 400, height: 300, background: '#e6f2ff', border: '1px solid #99ccff' },
    data: {
      label: 'Main VPC',
      type: 'vpc',
      resourceId: 'vpc-1',
      VpcId: 'vpc-12345678',
      CidrBlock: '10.0.0.0/16'
    }
  },
  
  // Subnet
  {
    id: 'subnet-1',
    type: 'subnet',
    position: { x: 50, y: 50 },
    parentId: 'vpc-1',
    extent: 'parent',
    style: { width: 300, height: 200, background: '#f0f0f0', border: '1px solid #cccccc' },
    data: {
      label: 'Public Subnet',
      type: 'subnet',
      resourceId: 'subnet-1',
      parentId: 'vpc-1',
      SubnetId: 'subnet-12345678',
      VpcId: 'vpc-12345678',
      CidrBlock: '10.0.1.0/24'
    }
  },
  
  // EC2 Instance
  {
    id: 'ec2-1',
    type: 'ec2',
    position: { x: 75, y: 50 },
    parentId: 'subnet-1',
    extent: 'parent',
    style: { width: 150, height: 100, background: '#ffffff', border: '1px solid #cccccc' },
    data: {
      label: 'Web Server',
      type: 'ec2',
      resourceId: 'ec2-1',
      parentId: 'subnet-1',
      InstanceId: 'i-12345678',
      InstanceType: 't3.medium',
      VpcId: 'vpc-12345678',
      SubnetId: 'subnet-12345678',
      ImageId: 'ami-12345678',
      Image: 'Amazon Linux 2'
    }
  }
]; 