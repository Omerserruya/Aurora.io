/**
 * Constants for AWS visualization components
 */

// Z-index values for proper layering
export const Z_INDEX = {
  CONTAINER: 5,
  HEADER: 7,
  RESOURCE: 10,
  SELECTED: 15
};

// Node type constants
export const NODE_TYPES = {
  VPC: 'vpc',
  SUBNET: 'subnet',
  EC2: 'ec2',
  SECURITY_GROUP: 'security_group',
  S3: 's3',
  ROUTE_TABLE: 'route_table',
  INTERNET_GATEWAY: 'internet_gateway',
  NAT_GATEWAY: 'nat_gateway',
  NETWORK_ACL: 'network_acl',
  ELASTIC_IP: 'elastic_ip',
  TRANSIT_GATEWAY: 'transit_gateway',
  LOAD_BALANCER: 'load_balancer',
  ECS_CLUSTER: 'ecs_cluster',
  ECS_TASK: 'ecs_task',
  LAMBDA_FUNCTION: 'lambda_function',
  IAM_ROLE: 'iam_role',
  IAM_USER: 'iam_user',
  IAM_POLICY: 'iam_policy',
  HEADER: 'header'
};

// Node dimensions
export const NODE_DIMENSIONS = {
  // VPC dimensions
  VPC: {
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 1000,
    INFO_CARD_WIDTH: 400,
    INFO_CARD_HEIGHT: 200,
    PADDING: 20,
    RESOURCE_SPACING: 20
  },
  
  // Subnet dimensions
  SUBNET: {
    DEFAULT_WIDTH: 600,
    DEFAULT_HEIGHT: 400,
    INFO_CARD_WIDTH: 400,
    INFO_CARD_HEIGHT: 150,
    PADDING: 20
  },
  
  // Resource node dimensions (EC2, etc.)
  RESOURCE: {
    DEFAULT_WIDTH: 400,
    DEFAULT_HEIGHT: 200,
    PADDING: 20,
    MARGIN: 20
  },
  
  // Header dimensions
  HEADER: {
    DEFAULT_WIDTH: 400,
    DEFAULT_HEIGHT: 200,
    PADDING: 20
  }
};

// Edge types
export const EDGE_TYPES = {
  VPC_TO_SUBNET: 'vpc-to-subnet',
  SUBNET_TO_EC2: 'subnet-to-ec2',
  SUBNET_TO_LB: 'subnet-to-lb',
  SUBNET_TO_RDS: 'subnet-to-rds',
  RT_TO_SUBNET: 'rt-to-subnet',
  IGW_TO_VPC: 'igw-to-vpc',
  NATGW_TO_VPC: 'natgw-to-vpc',
  SG_TO_RESOURCE: 'sg-to-resource',
  SG_TO_SG: 'sg-to-sg',
  EC2_TO_EBS: 'ec2-to-ebs',
  EC2_TO_IAM: 'ec2-to-iam',
  LB_TO_EC2: 'lb-to-ec2',
  LAMBDA_TO_APIGW: 'lambda-to-apigw',
  LAMBDA_TO_EVENT: 'lambda-to-event',
  IAM_TO_RESOURCE: 'iam-to-resource'
};

// Default spacing for global layout
export const GLOBAL_LAYOUT = {
  X_START: 50,
  Y_START: 50,
  VPC_SPACING: 1250,
  GRID_COLUMNS: 2
}; 