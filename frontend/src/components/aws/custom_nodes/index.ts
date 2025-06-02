import { NodeTypes } from 'reactflow';
import VpcNode from './VpcNode';
import SubnetNode from './SubnetNode';
import Ec2Node from './Ec2Node';
import LoadBalancerNode from './LoadBalancerNode';
import InternetGatewayNode from './InternetGatewayNode';
import S3BucketNode from './S3BucketNode';
import GlobalInternetNode from './GlobalInternetNode';

export interface CustomNodeData {
  label: string;
}

export const nodeTypes: NodeTypes = {
  vpc: VpcNode,
  subnet: SubnetNode,
  ec2: Ec2Node,
  alb: LoadBalancerNode,
  internetgateway: InternetGatewayNode,
  s3bucket: S3BucketNode,
  internet: GlobalInternetNode
}; 