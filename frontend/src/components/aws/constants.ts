import { ResourceColorScheme } from './types';

// Node types
export const NODE_TYPES = {
  VPC: 'vpc',
  SUBNET: 'subnet',
  EC2: 'ec2',
  S3: 's3',
  SECURITY_GROUP: 'security_group',
  ROUTE_TABLE: 'route_table',
  INTERNET_GATEWAY: 'internet_gateway',
  NAT_GATEWAY: 'nat_gateway',
  NETWORK_ACL: 'network_acl',
  LOAD_BALANCER: 'load_balancer',
  LAMBDA: 'lambda',
  IAM_ROLE: 'iam_role',
  IAM_USER: 'iam_user',
  IAM_POLICY: 'iam_policy',
  RDS: 'rds',
  DYNAMODB: 'dynamodb',
  SQS: 'sqs',
  SNS: 'sns',
  CLOUDWATCH: 'cloudwatch',
  API_GATEWAY: 'api_gateway',
  ECS: 'ecs',
  EKS: 'eks',
  ELASTIC_BEANSTALK: 'elastic_beanstalk',
  KMS: 'kms',
  GLOBAL_CONTAINER: 'global_container',
  GENERIC: 'generic' // Fallback for unknown resource types
};

// Resource color schemes - AWS color palette with light/dark variants
export const RESOURCE_COLORS: Record<string, ResourceColorScheme> = {
  [NODE_TYPES.VPC]: {
    border: '#232F3E',
    bgLight: '#F2F4F4',
    bgDark: '#1A232E'
  },
  [NODE_TYPES.SUBNET]: {
    border: '#7AA116',
    bgLight: '#F0F6E9',
    bgDark: '#304009'
  },
  [NODE_TYPES.EC2]: {
    border: '#EC7211',
    bgLight: '#FDF2EA',
    bgDark: '#5F2E07'
  },
  [NODE_TYPES.S3]: {
    border: '#FF9900',
    bgLight: '#FFF6E6',
    bgDark: '#663D00'
  },
  [NODE_TYPES.SECURITY_GROUP]: {
    border: '#C925D1',
    bgLight: '#F9EEFA',
    bgDark: '#4C0E52'
  },
  [NODE_TYPES.ROUTE_TABLE]: {
    border: '#8C4FFF',
    bgLight: '#F4EEFF',
    bgDark: '#2E1A55'
  },
  [NODE_TYPES.INTERNET_GATEWAY]: {
    border: '#1166BB',
    bgLight: '#E6F1FA',
    bgDark: '#082A4D'
  },
  [NODE_TYPES.NAT_GATEWAY]: {
    border: '#3B48CC',
    bgLight: '#EDEFFA',
    bgDark: '#171D52'
  },
  [NODE_TYPES.NETWORK_ACL]: {
    border: '#C60084',
    bgLight: '#FAE6F3',
    bgDark: '#500035'
  },
  [NODE_TYPES.LOAD_BALANCER]: {
    border: '#02A1AB',
    bgLight: '#E6F7F8',
    bgDark: '#014045'
  },
  [NODE_TYPES.LAMBDA]: {
    border: '#FF9900',
    bgLight: '#FFF6E6',
    bgDark: '#663D00'
  },
  [NODE_TYPES.IAM_ROLE]: {
    border: '#D13212',
    bgLight: '#FAEAE6',
    bgDark: '#541407'
  },
  [NODE_TYPES.IAM_USER]: {
    border: '#D13212',
    bgLight: '#FAEAE6',
    bgDark: '#541407'
  },
  [NODE_TYPES.IAM_POLICY]: {
    border: '#D13212',
    bgLight: '#FAEAE6',
    bgDark: '#541407'
  },
  [NODE_TYPES.RDS]: {
    border: '#3B48CC',
    bgLight: '#EDEFFA',
    bgDark: '#171D52'
  },
  [NODE_TYPES.DYNAMODB]: {
    border: '#3B48CC',
    bgLight: '#EDEFFA',
    bgDark: '#171D52'
  },
  [NODE_TYPES.SQS]: {
    border: '#CC2F8E',
    bgLight: '#FAE9F4',
    bgDark: '#511239'
  },
  [NODE_TYPES.SNS]: {
    border: '#CC2F8E',
    bgLight: '#FAE9F4',
    bgDark: '#511239'
  },
  [NODE_TYPES.CLOUDWATCH]: {
    border: '#2E27AD',
    bgLight: '#EBEAFA',
    bgDark: '#131045'
  },
  [NODE_TYPES.API_GATEWAY]: {
    border: '#CC2F8E',
    bgLight: '#FAE9F4',
    bgDark: '#511239'
  },
  [NODE_TYPES.ECS]: {
    border: '#FF9900',
    bgLight: '#FFF6E6',
    bgDark: '#663D00'
  },
  [NODE_TYPES.EKS]: {
    border: '#FF9900',
    bgLight: '#FFF6E6',
    bgDark: '#663D00'
  },
  [NODE_TYPES.ELASTIC_BEANSTALK]: {
    border: '#1BAE42',
    bgLight: '#E8F9EE',
    bgDark: '#0B451B'
  },
  [NODE_TYPES.KMS]: {
    border: '#C925D1',
    bgLight: '#F9EEFA',
    bgDark: '#4C0E52'
  },
  [NODE_TYPES.GLOBAL_CONTAINER]: {
    border: '#0073BB',
    bgLight: '#E6F4FF',
    bgDark: '#003966'
  },
  [NODE_TYPES.GENERIC]: {
    border: '#232F3E',
    bgLight: '#F2F4F4',
    bgDark: '#1A232E'
  }
};

// Layout configuration
export const LAYOUT_CONFIG = {
  padding: 20,
  vpcPadding: 40,
  subnetPadding: 20,
  nodeSpacing: 60,
  levelSpacing: 100
};

// ELK layout settings
export const ELK_LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': 100,
  'elk.layered.spacing.nodeNodeBetweenLayers': 120,
  'elk.spacing.edgeNode': 40,
  'elk.padding': '[top=40,left=40,bottom=40,right=40]',
  'elk.aspectRatio': 2.0
};

export const NODE_DIMENSIONS = {
  VPC: {
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 1000,
    INFO_CARD_HEIGHT: 200,
    PADDING: 40
  },
  SUBNET: {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 500,
    INFO_CARD_HEIGHT: 150,
    PADDING: 30
  },
  RESOURCE: {
    DEFAULT_WIDTH: 400,
    DEFAULT_HEIGHT: 200,
    MARGIN: 40,
    PADDING: 20
  },
  HEADER: {
    DEFAULT_WIDTH: 400,
    DEFAULT_HEIGHT: 200,
    PADDING: 20
  }
}; 