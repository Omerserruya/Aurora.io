import { ResourceColorScheme } from '../types';

// Import AWS SVG icons directly
import VPCIcon from '../../../assets/aws-icons/Networking/vpc.svg';
import SubnetIcon from '../../../assets/aws-icons/Networking/subnet.svg';
import EC2Icon from '../../../assets/aws-icons/Compute/ec2.svg';
import SecurityGroupIcon from '../../../assets/aws-icons/Security/security-group.svg';
import S3Icon from '../../../assets/aws-icons/Storage/s3.svg';
import RouteTableIcon from '../../../assets/aws-icons/Networking/route-table.svg';
import InternetGatewayIcon from '../../../assets/aws-icons/Networking/internet-gateway.svg';
import NATGatewayIcon from '../../../assets/aws-icons/Networking/nat-gateway.svg';
import NetworkACLIcon from '../../../assets/aws-icons/Networking/network-acl.svg';
import ElasticIPIcon from '../../../assets/aws-icons/Networking/elastic-ip.svg';
import TransitGatewayIcon from '../../../assets/aws-icons/Networking/transit-gateway.svg';
import LoadBalancerIcon from '../../../assets/aws-icons/Networking/load-balancer.svg';
import ECSClusterIcon from '../../../assets/aws-icons/Containers/ecs-cluster.svg';
import ECSTaskIcon from '../../../assets/aws-icons/Containers/ecs-task.svg';
import LambdaIcon from '../../../assets/aws-icons/Compute/lambda.svg';
import IAMRoleIcon from '../../../assets/aws-icons/Security/iam-role.svg';
import IAMUserIcon from '../../../assets/aws-icons/Security/iam-user.svg';
import IAMPolicyIcon from '../../../assets/aws-icons/Security/iam-policy.svg';

// Helper function to get the icon for a resource type
export const getResourceIcon = (resourceType: string): string => {
  switch (resourceType) {
    case 'vpc':
      return VPCIcon;
    case 'subnet':
      return SubnetIcon;
    case 'ec2':
      return EC2Icon;
    case 'security_group':
      return SecurityGroupIcon;
    case 's3':
      return S3Icon;
    case 'route_table':
      return RouteTableIcon;
    case 'internet_gateway':
      return InternetGatewayIcon;
    case 'nat_gateway':
      return NATGatewayIcon;
    case 'network_acl':
      return NetworkACLIcon;
    case 'elastic_ip':
      return ElasticIPIcon;
    case 'transit_gateway':
      return TransitGatewayIcon;
    case 'load_balancer':
      return LoadBalancerIcon;
    case 'ecs_cluster':
      return ECSClusterIcon;
    case 'ecs_task':
      return ECSTaskIcon;
    case 'lambda_function':
      return LambdaIcon;
    case 'iam_role':
      return IAMRoleIcon;
    case 'iam_user':
      return IAMUserIcon;
    case 'iam_policy':
      return IAMPolicyIcon;
    default:
      return VPCIcon; // Default icon
  }
};

// Helper function to get the color for a resource type
export const getResourceColors = (resourceType: string): ResourceColorScheme => {
  switch (resourceType) {
    case 'vpc':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'subnet':
      return { border: '#7AA116', bgLight: 'rgba(122, 161, 22, 0.1)', bgDark: 'rgba(122, 161, 22, 0.2)' };
    case 'ec2':
      return { border: '#EC7211', bgLight: 'rgba(236, 114, 17, 0.1)', bgDark: 'rgba(236, 114, 17, 0.2)' };
    case 'security_group':
      return { border: '#D13212', bgLight: 'rgba(209, 50, 18, 0.1)', bgDark: 'rgba(209, 50, 18, 0.2)' };
    case 's3':
      return { border: '#7AA116', bgLight: 'rgba(122, 161, 22, 0.1)', bgDark: 'rgba(122, 161, 22, 0.2)' };
    case 'route_table':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'internet_gateway':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'nat_gateway':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'network_acl':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'elastic_ip':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'transit_gateway':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'load_balancer':
      return { border: '#8C4FFF', bgLight: 'rgba(140, 79, 255, 0.1)', bgDark: 'rgba(140, 79, 255, 0.2)' };
    case 'ecs_cluster':
      return { border: '#E7157B', bgLight: 'rgba(231, 21, 123, 0.1)', bgDark: 'rgba(231, 21, 123, 0.2)' };
    case 'ecs_task':
      return { border: '#E7157B', bgLight: 'rgba(231, 21, 123, 0.1)', bgDark: 'rgba(231, 21, 123, 0.2)' };
    case 'lambda_function':
      return { border: '#EC7211', bgLight: 'rgba(236, 114, 17, 0.1)', bgDark: 'rgba(236, 114, 17, 0.2)' };
    case 'iam_role':
      return { border: '#D13212', bgLight: 'rgba(209, 50, 18, 0.1)', bgDark: 'rgba(209, 50, 18, 0.2)' };
    case 'iam_user':
      return { border: '#D13212', bgLight: 'rgba(209, 50, 18, 0.1)', bgDark: 'rgba(209, 50, 18, 0.2)' };
    case 'iam_policy':
      return { border: '#D13212', bgLight: 'rgba(209, 50, 18, 0.1)', bgDark: 'rgba(209, 50, 18, 0.2)' };
    default:
      return { border: '#ccc', bgLight: '#f8f8f8', bgDark: '#f0f0f0' };
  }
};

// Helper function for resource type display names
export const getResourceTypeName = (resourceType: string): string => {
  switch (resourceType) {
    case 'vpc':
      return 'VPC';
    case 'subnet':
      return 'Subnet';
    case 'ec2':
      return 'EC2 Instance';
    case 'security_group':
      return 'Security Group';
    case 's3':
      return 'S3 Bucket';
    case 'route_table':
      return 'Route Table';
    case 'internet_gateway':
      return 'Internet Gateway';
    case 'nat_gateway':
      return 'NAT Gateway';
    case 'network_acl':
      return 'Network ACL';
    case 'elastic_ip':
      return 'Elastic IP';
    case 'transit_gateway':
      return 'Transit Gateway';
    case 'load_balancer':
      return 'Load Balancer';
    case 'ecs_cluster':
      return 'ECS Cluster';
    case 'ecs_task':
      return 'ECS Task';
    case 'lambda_function':
      return 'Lambda Function';
    case 'iam_role':
      return 'IAM Role';
    case 'iam_user':
      return 'IAM User';
    case 'iam_policy':
      return 'IAM Policy';
    default:
      return resourceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}; 