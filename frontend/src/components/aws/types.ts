import { AWSArchitecture } from '../aws-architecture-visualizer';
import { AWSNode as AWSNodeType, AWSNodeDataTypes } from './awsNodes';
import { AWSEdge } from './awsEdges';

export interface CloudDiagramProps {
  awsData?: AWSArchitecture;
}

export interface SectionBottoms {
  vpc_info: number;
  igw: number;
  subnets: number;
  routeTables: number;
  securityGroups: number;
  networkAcls: number;
  elasticIPs: number;
  transitGateways: number;
  lambdaFunctions: number;
  ecsClusters: number;
}

export enum RelationshipType {
  VPC_TO_SUBNET = 'vpc-to-subnet',
  SUBNET_TO_EC2 = 'subnet-to-ec2',
  SG_TO_RESOURCE = 'sg-to-resource',
  RT_TO_SUBNET = 'rt-to-subnet',
  IGW_TO_VPC = 'igw-to-vpc',
  NATGW_TO_VPC = 'natgw-to-vpc',
  LB_TO_EC2 = 'lb-to-ec2',
  IAM_TO_RESOURCE = 'iam-to-resource'
}

export interface ResourceColorScheme {
  border: string;
  bgLight: string;
  bgDark: string;
}

export interface ConversionResult {
  nodes: AWSNodeType[];
  edges: AWSEdge[];
} 