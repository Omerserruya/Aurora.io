import { NodeTypes } from 'reactflow';
import ContainerNode from './components/ContainerNode';
import ResourceNode from './components/ResourceNode';
import { NODE_TYPES } from './utils/constants';

// Define custom node types
const nodeTypes: NodeTypes = {
  // Container nodes
  [NODE_TYPES.VPC]: ContainerNode,
  [NODE_TYPES.SUBNET]: ContainerNode,
  
  // Regular resource nodes
  [NODE_TYPES.EC2]: ResourceNode,
  [NODE_TYPES.SECURITY_GROUP]: ResourceNode,
  [NODE_TYPES.S3]: ResourceNode,
  [NODE_TYPES.ROUTE_TABLE]: ResourceNode,
  [NODE_TYPES.INTERNET_GATEWAY]: ResourceNode,
  [NODE_TYPES.NAT_GATEWAY]: ResourceNode,
  [NODE_TYPES.NETWORK_ACL]: ResourceNode,
  [NODE_TYPES.ELASTIC_IP]: ResourceNode,
  [NODE_TYPES.TRANSIT_GATEWAY]: ResourceNode,
  [NODE_TYPES.LOAD_BALANCER]: ResourceNode,
  [NODE_TYPES.ECS_CLUSTER]: ResourceNode,
  [NODE_TYPES.ECS_TASK]: ResourceNode,
  [NODE_TYPES.LAMBDA_FUNCTION]: ResourceNode,
  [NODE_TYPES.IAM_ROLE]: ResourceNode,
  [NODE_TYPES.IAM_USER]: ResourceNode,
  [NODE_TYPES.IAM_POLICY]: ResourceNode,
  [NODE_TYPES.HEADER]: ResourceNode
};

export default nodeTypes; 