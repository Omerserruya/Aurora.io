import { Node, Edge } from 'reactflow';
import { AWSNode, AWSNodeData } from './awsNodes';
import { AWSEdge, AWSEdgeData } from './awsEdges';

// Base type for AWS resource data
export interface AWSResourceData {
  resourceId: string;
  type: string;
  label: string;
  properties?: Record<string, any>;
}

// Consolidated AWS resources structure
export interface AWSResources {
  vpcs: AWSVpc[];
  s3Buckets: AWSS3Bucket[];
  iamRoles?: AWSIamRole[];
  iamUsers?: AWSIamUser[];
  iamPolicies?: AWSIamPolicy[];
  lambdaFunctions?: AWSLambdaFunction[];
  dynamoDbTables?: AWSDynamoDbTable[];
  rdsInstances?: AWSRdsInstance[];
  ecsServices?: AWSEcsService[];
  cloudwatchAlarms?: AWSCloudwatchAlarm[];
  snsTopics?: AWSSNSTopic[];
  sqsQueues?: AWSSQSQueue[];
  apiGateways?: AWSApiGateway[];
  elasticBeanstalkEnvironments?: AWSElasticBeanstalk[];
  eksServices?: AWSEksService[];
  kmsKeys?: AWSKmsKey[];
  // Allow for additional resource types
  [resourceType: string]: (AWSVpc | AWSS3Bucket | AWSIamRole | AWSIamUser | 
                          AWSIamPolicy | AWSLambdaFunction | AWSDynamoDbTable | 
                          AWSRdsInstance | AWSEcsService | AWSCloudwatchAlarm | 
                          AWSSNSTopic | AWSSQSQueue | AWSApiGateway | 
                          AWSElasticBeanstalk | AWSEksService | AWSKmsKey | any)[] | undefined;
}

// Core AWS resources 
export interface AWSVpc {
  vpcId: string;
  properties: Record<string, any>;
  subnets: AWSSubnet[];
  securityGroups: AWSSecurityGroup[];
  routeTables?: AWSRouteTable[];
  internetGateways?: AWSInternetGateway[];
  natGateways?: AWSNatGateway[];
  networkAcls?: AWSNetworkAcl[];
  loadBalancers?: AWSLoadBalancer[];
}

export interface AWSSubnet {
  subnetId: string;
  properties: Record<string, any>;
  instances: AWSInstance[];
}

export interface AWSInstance {
  instanceId: string;
  properties: Record<string, any>;
}

export interface AWSSecurityGroup {
  groupId: string;
  properties: Record<string, any>;
  inboundRules?: any[];
  outboundRules?: any[];
}

export interface AWSRouteTable {
  routeTableId: string;
  properties: Record<string, any>;
}

export interface AWSInternetGateway {
  internetGatewayId: string;
  properties: Record<string, any>;
}

export interface AWSNatGateway {
  natGatewayId: string;
  properties: Record<string, any>;
}

export interface AWSNetworkAcl {
  networkAclId: string;
  properties: Record<string, any>;
}

export interface AWSLoadBalancer {
  loadBalancerArn: string;
  loadBalancerName: string;
  properties: Record<string, any>;
}

// Global AWS resources
export interface AWSS3Bucket {
  name: string;
  properties: Record<string, any>;
}

export interface AWSIamRole {
  roleName: string;
  roleId: string;
  properties: Record<string, any>;
}

export interface AWSIamUser {
  userName: string;
  userId: string;
  properties: Record<string, any>;
}

export interface AWSIamPolicy {
  policyName: string;
  policyId: string;
  properties: Record<string, any>;
}

export interface AWSLambdaFunction {
  functionName: string;
  functionArn: string;
  properties: Record<string, any>;
}

export interface AWSDynamoDbTable {
  tableName: string;
  tableArn: string;
  properties: Record<string, any>;
}

export interface AWSRdsInstance {
  dbInstanceIdentifier: string;
  properties: Record<string, any>;
}

export interface AWSEcsService {
  serviceName: string;
  clusterArn: string;
  properties: Record<string, any>;
}

export interface AWSCloudwatchAlarm {
  alarmName: string;
  properties: Record<string, any>;
}

export interface AWSSNSTopic {
  topicArn: string;
  properties: Record<string, any>;
}

export interface AWSSQSQueue {
  queueUrl: string;
  properties: Record<string, any>;
}

export interface AWSApiGateway {
  apiId: string;
  properties: Record<string, any>;
}

export interface AWSElasticBeanstalk {
  environmentId: string;
  properties: Record<string, any>;
}

export interface AWSEksService {
  clusterName: string;
  properties: Record<string, any>;
}

export interface AWSKmsKey {
  keyId: string;
  properties: Record<string, any>;
}

// Relationship types
export enum RelationshipType {
  VPC_TO_SUBNET = 'vpc-to-subnet',
  SUBNET_TO_EC2 = 'subnet-to-ec2',
  SG_TO_RESOURCE = 'sg-to-resource',
  SG_TO_SG = 'sg-to-sg',
  RT_TO_SUBNET = 'rt-to-subnet',
  IGW_TO_VPC = 'igw-to-vpc',
  NATGW_TO_VPC = 'natgw-to-vpc',
  LB_TO_EC2 = 'lb-to-ec2',
  SUBNET_TO_LB = 'subnet-to-lb',
  IAM_TO_RESOURCE = 'iam-to-resource',
  LAMBDA_TO_OTHER = 'lambda-to-other',
  LAMBDA_TO_APIGW = 'lambda-to-apigw',
  LAMBDA_TO_EVENT = 'lambda-to-event',
  RESOURCE_TO_RESOURCE = 'resource-to-resource'
}

// Resource color scheme
export interface ResourceColorScheme {
  border: string;
  bgLight: string;
  bgDark: string;
  text?: string;
}

// Props for CloudDiagram component
export interface CloudDiagramProps {
  awsData?: AWSResources | any; // Accept both AWSResources and AWSArchitecture
}

// Result of AWS data conversion
export interface ConversionResult {
  nodes: AWSNode[];
  edges: AWSEdge[];
} 