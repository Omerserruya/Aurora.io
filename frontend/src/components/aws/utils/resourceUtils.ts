import { NODE_TYPES, RESOURCE_COLORS } from '../constants';
import { ResourceColorScheme } from '../types';

// Import available AWS icons from assets
import vpcIcon from '../../../assets/aws-icons/Networking/vpc.svg';
import subnetIcon from '../../../assets/aws-icons/Networking/subnet.svg';
import ec2Icon from '../../../assets/aws-icons/Compute/ec2.svg';
import s3Icon from '../../../assets/aws-icons/Storage/s3.svg';
import securityGroupIcon from '../../../assets/aws-icons/Security/security-group.svg';
import routeTableIcon from '../../../assets/aws-icons/Networking/route-table.svg';
import internetGatewayIcon from '../../../assets/aws-icons/Networking/internet-gateway.svg';
import natGatewayIcon from '../../../assets/aws-icons/Networking/nat-gateway.svg';
import networkAclIcon from '../../../assets/aws-icons/Networking/network-acl.svg';
import loadBalancerIcon from '../../../assets/aws-icons/Networking/load-balancer.svg';
import lambdaIcon from '../../../assets/aws-icons/Compute/lambda.svg';
import iamRoleIcon from '../../../assets/aws-icons/Security/iam-role.svg';
import iamUserIcon from '../../../assets/aws-icons/Security/iam-user.svg';
import iamPolicyIcon from '../../../assets/aws-icons/Security/iam-policy.svg';
import ecsIcon from '../../../assets/aws-icons/Containers/ecs-cluster.svg';

// Fallback icons for missing resources
const fallbackIcon = 'https://cdn-icons-png.flaticon.com/512/873/873120.png';

// Map of resource type to SVG icon
export const RESOURCE_ICONS: Record<string, string> = {
  [NODE_TYPES.VPC]: vpcIcon,
  [NODE_TYPES.SUBNET]: subnetIcon,
  [NODE_TYPES.EC2]: ec2Icon,
  [NODE_TYPES.S3]: s3Icon,
  [NODE_TYPES.SECURITY_GROUP]: securityGroupIcon,
  [NODE_TYPES.ROUTE_TABLE]: routeTableIcon,
  [NODE_TYPES.INTERNET_GATEWAY]: internetGatewayIcon,
  [NODE_TYPES.NAT_GATEWAY]: natGatewayIcon,
  [NODE_TYPES.NETWORK_ACL]: networkAclIcon,
  [NODE_TYPES.LOAD_BALANCER]: loadBalancerIcon,
  [NODE_TYPES.LAMBDA]: lambdaIcon,
  [NODE_TYPES.IAM_ROLE]: iamRoleIcon,
  [NODE_TYPES.IAM_USER]: iamUserIcon,
  [NODE_TYPES.IAM_POLICY]: iamPolicyIcon,
  [NODE_TYPES.RDS]: fallbackIcon,
  [NODE_TYPES.DYNAMODB]: fallbackIcon,
  [NODE_TYPES.SQS]: fallbackIcon,
  [NODE_TYPES.SNS]: fallbackIcon,
  [NODE_TYPES.CLOUDWATCH]: fallbackIcon,
  [NODE_TYPES.API_GATEWAY]: fallbackIcon,
  [NODE_TYPES.ECS]: ecsIcon,
  [NODE_TYPES.EKS]: fallbackIcon,
  [NODE_TYPES.ELASTIC_BEANSTALK]: fallbackIcon,
  [NODE_TYPES.KMS]: fallbackIcon,
  [NODE_TYPES.GLOBAL_CONTAINER]: fallbackIcon,
  [NODE_TYPES.GENERIC]: fallbackIcon,
  'header': fallbackIcon
};

// Map of resource type to display name
export const RESOURCE_TYPE_NAMES: Record<string, string> = {
  [NODE_TYPES.VPC]: 'VPC',
  [NODE_TYPES.SUBNET]: 'Subnet',
  [NODE_TYPES.EC2]: 'EC2 Instance',
  [NODE_TYPES.S3]: 'S3 Bucket',
  [NODE_TYPES.SECURITY_GROUP]: 'Security Group',
  [NODE_TYPES.ROUTE_TABLE]: 'Route Table',
  [NODE_TYPES.INTERNET_GATEWAY]: 'Internet Gateway',
  [NODE_TYPES.NAT_GATEWAY]: 'NAT Gateway',
  [NODE_TYPES.NETWORK_ACL]: 'Network ACL',
  [NODE_TYPES.LOAD_BALANCER]: 'Load Balancer',
  [NODE_TYPES.LAMBDA]: 'Lambda Function',
  [NODE_TYPES.IAM_ROLE]: 'IAM Role',
  [NODE_TYPES.IAM_USER]: 'IAM User',
  [NODE_TYPES.IAM_POLICY]: 'IAM Policy',
  [NODE_TYPES.RDS]: 'RDS Database',
  [NODE_TYPES.DYNAMODB]: 'DynamoDB Table',
  [NODE_TYPES.SQS]: 'SQS Queue',
  [NODE_TYPES.SNS]: 'SNS Topic',
  [NODE_TYPES.CLOUDWATCH]: 'CloudWatch',
  [NODE_TYPES.API_GATEWAY]: 'API Gateway',
  [NODE_TYPES.ECS]: 'ECS Cluster',
  [NODE_TYPES.EKS]: 'EKS Cluster',
  [NODE_TYPES.ELASTIC_BEANSTALK]: 'Elastic Beanstalk',
  [NODE_TYPES.KMS]: 'KMS Key',
  [NODE_TYPES.GLOBAL_CONTAINER]: 'Global Resources',
  [NODE_TYPES.GENERIC]: 'AWS Resource'
};

/**
 * Get resource icon URL for a given resource type
 */
export function getResourceIcon(resourceType: string): string {
  return RESOURCE_ICONS[resourceType] || RESOURCE_ICONS[NODE_TYPES.GENERIC];
}

/**
 * Get resource type friendly name
 */
export function getResourceTypeName(resourceType: string): string {
  return RESOURCE_TYPE_NAMES[resourceType] || 'AWS Resource';
}

/**
 * Get color scheme for a resource type
 */
export function getResourceColors(resourceType: string): ResourceColorScheme {
  return RESOURCE_COLORS[resourceType] || RESOURCE_COLORS[NODE_TYPES.GENERIC];
}

/**
 * Format resource properties for display
 */
export function formatProperties(properties: Record<string, any>): Record<string, string> {
  if (!properties) return {};
  
  const formattedProps: Record<string, string> = {};
  
  Object.entries(properties)
    .filter(([key]) => !['label', 'type', 'resourceId', 'faded'].includes(key))
    .forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        formattedProps[key] = JSON.stringify(value);
      } else if (value === null || value === undefined) {
        formattedProps[key] = 'Not specified';
      } else {
        formattedProps[key] = String(value);
      }
    });
  
  return formattedProps;
} 