import { NodeTypes } from 'reactflow';
import { NODE_TYPES } from './constants';
import AWSNode from './components/AWSNode';
import ContainerNode from './components/ContainerNode';
import HeaderNode from './components/HeaderNode';

// Registry of custom node types for React Flow
const nodeTypes: NodeTypes = {
  // Container nodes
  [NODE_TYPES.VPC]: ContainerNode,
  [NODE_TYPES.SUBNET]: ContainerNode,
  [NODE_TYPES.GLOBAL_CONTAINER]: ContainerNode, // Global container for non-VPC resources
  
  // Header node for containers
  'header': HeaderNode,
  
  // Resource nodes
  [NODE_TYPES.EC2]: AWSNode,
  [NODE_TYPES.SECURITY_GROUP]: AWSNode,
  [NODE_TYPES.ROUTE_TABLE]: AWSNode,
  [NODE_TYPES.INTERNET_GATEWAY]: AWSNode,
  [NODE_TYPES.NAT_GATEWAY]: AWSNode,
  [NODE_TYPES.NETWORK_ACL]: AWSNode,
  [NODE_TYPES.LOAD_BALANCER]: AWSNode,
  
  // Storage
  [NODE_TYPES.S3]: AWSNode,
  [NODE_TYPES.DYNAMODB]: AWSNode,
  [NODE_TYPES.RDS]: AWSNode,
  
  // Compute and Serverless
  [NODE_TYPES.LAMBDA]: AWSNode,
  [NODE_TYPES.ECS]: AWSNode,
  [NODE_TYPES.EKS]: AWSNode,
  [NODE_TYPES.ELASTIC_BEANSTALK]: AWSNode,
  
  // Security and Identity
  [NODE_TYPES.IAM_ROLE]: AWSNode,
  [NODE_TYPES.IAM_USER]: AWSNode,
  [NODE_TYPES.IAM_POLICY]: AWSNode,
  [NODE_TYPES.KMS]: AWSNode,
  
  // Messaging
  [NODE_TYPES.SQS]: AWSNode,
  [NODE_TYPES.SNS]: AWSNode,
  
  // API and Monitoring
  [NODE_TYPES.API_GATEWAY]: AWSNode,
  [NODE_TYPES.CLOUDWATCH]: AWSNode,
  
  // Generic fallback
  [NODE_TYPES.GENERIC]: AWSNode
};

export default nodeTypes; 