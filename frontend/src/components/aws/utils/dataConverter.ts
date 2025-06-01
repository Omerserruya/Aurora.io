import { ConversionResult, AWSResources, AWSDynamoDbTable } from '../types';
import { NODE_TYPES } from '../constants';
import { resetEdgeIdCounter, generateEdgeId } from './edgeFactory';
import { createResourceNode } from './nodeFactory';
import VpcProcessor from '../processors/vpcProcessor';
import S3Processor from '../processors/s3Processor';
import IamProcessor from '../processors/iamProcessor';
import LambdaProcessor from '../processors/lambdaProcessor';

// Node ID counter
let nodeIdCounter = 0;

/**
 * Generate a unique node ID
 */
const generateNodeId = () => {
  return `n-${++nodeIdCounter}`;
};

/**
 * Reset ID counters
 */
const resetIdCounters = () => {
  nodeIdCounter = 0;
  resetEdgeIdCounter();
};

/**
 * Convert AWS architecture data to ReactFlow nodes and edges
 */
export function convertAwsDataToFlow(awsData: AWSResources): ConversionResult {
  // Reset ID counters to ensure fresh IDs for each conversion
  resetIdCounters();
  
  // Initialize result
  const result: ConversionResult = {
    nodes: [],
    edges: []
  };
  
  // Process resources in a specific order to ensure proper hierarchy
  
  // 1. Process VPC resources first (which will cascade to subnets, EC2, etc.)
  if (awsData.vpcs && awsData.vpcs.length > 0) {
    const vpcProcessor = new VpcProcessor();
    vpcProcessor.process(awsData.vpcs, result, generateNodeId, generateEdgeId);
  }
  
  // 2. Process global services that don't belong to a VPC
  processGlobalResources(awsData, result);
  
  return result;
}

/**
 * Process resources that aren't part of a VPC
 */
function processGlobalResources(
  awsData: AWSResources,
  result: ConversionResult
): void {
  // Process S3 buckets
  if (awsData.s3Buckets && awsData.s3Buckets.length > 0) {
    const s3Processor = new S3Processor();
    s3Processor.process(awsData.s3Buckets, result, generateNodeId, generateEdgeId);
  }
  
  // Process IAM resources
  const iamProcessor = new IamProcessor();
  if ((awsData.iamRoles && awsData.iamRoles.length > 0) || 
      (awsData.iamUsers && awsData.iamUsers.length > 0) || 
      (awsData.iamPolicies && awsData.iamPolicies.length > 0)) {
    iamProcessor.process({
      roles: awsData.iamRoles || [],
      users: awsData.iamUsers || [],
      policies: awsData.iamPolicies || []
    }, result, generateNodeId, generateEdgeId);
  }

  // Process Lambda Functions (that aren't in VPCs)
  if (awsData.lambdaFunctions && awsData.lambdaFunctions.length > 0) {
    const lambdaProcessor = new LambdaProcessor();
    const standaloneLambdas = awsData.lambdaFunctions.filter(lambda => !lambda.properties?.VpcConfig?.VpcId);
    lambdaProcessor.process(standaloneLambdas, result, generateNodeId, generateEdgeId);
  }

  // Process DynamoDB Tables
  if (awsData.dynamoDbTables && awsData.dynamoDbTables.length > 0) {
    processDynamoDbTables(awsData.dynamoDbTables, result);
  }

  // Process RDS Instances (that aren't in VPCs)
  if (awsData.rdsInstances && awsData.rdsInstances.length > 0) {
    const standaloneRds = awsData.rdsInstances.filter(rds => !rds.properties?.DBSubnetGroup?.VpcId);
    processRdsInstances(standaloneRds, result);
  }

  // Process other resource types
  processOtherResourceTypes(awsData, result);
}

/**
 * Process DynamoDB Tables
 */
function processDynamoDbTables(
  tables: AWSDynamoDbTable[],
  result: ConversionResult
): void {
  // Position tables in a grid pattern
  const startX = 300;
  const startY = 100;
  const spacing = 200;
  const itemsPerRow = 3;
  
  tables.forEach((table, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const nodeId = generateNodeId();
    
    result.nodes.push(
      createResourceNode(
        nodeId,
        table.tableName,
        NODE_TYPES.DYNAMODB as string,
        table.tableArn,
        undefined, // No parent
        startX + (col * spacing),
        startY + (row * spacing),
        {
          TableName: table.tableName,
          TableArn: table.tableArn,
          ...table.properties
        }
      )
    );
  });
}

/**
 * Process RDS Instances
 */
function processRdsInstances(
  instances: any[],
  result: ConversionResult
): void {
  // Position RDS instances
  const startX = 300;
  const startY = 500;
  const spacing = 200;
  
  instances.forEach((instance, index) => {
    const nodeId = generateNodeId();
    
    result.nodes.push(
      createResourceNode(
        nodeId,
        instance.dbInstanceIdentifier,
        NODE_TYPES.RDS as string,
        instance.dbInstanceIdentifier,
        undefined, // No parent
        startX + (index * spacing),
        startY,
        {
          DBInstanceIdentifier: instance.dbInstanceIdentifier,
          Engine: instance.properties?.Engine || 'Unknown',
          ...instance.properties
        }
      )
    );
  });
}

/**
 * Process any other AWS resource types
 */
function processOtherResourceTypes(
  awsData: AWSResources,
  result: ConversionResult
): void {
  // Define layout areas for different services
  const layoutAreas = {
    apiGateway: { x: 900, y: 100, spacing: 200, perRow: 2 },
    sqs: { x: 900, y: 300, spacing: 200, perRow: 2 },
    sns: { x: 900, y: 500, spacing: 200, perRow: 2 },
    cloudwatch: { x: 100, y: 700, spacing: 200, perRow: 2 },
    eks: { x: 500, y: 700, spacing: 200, perRow: 1 },
    ecs: { x: 700, y: 700, spacing: 200, perRow: 1 },
    elasticBeanstalk: { x: 100, y: 900, spacing: 200, perRow: 2 },
    kms: { x: 500, y: 900, spacing: 200, perRow: 2 }
  };

  // Process API Gateways
  if (awsData.apiGateways && awsData.apiGateways.length > 0) {
    awsData.apiGateways.forEach((api, index) => {
      const area = layoutAreas.apiGateway;
      const row = Math.floor(index / area.perRow);
      const col = index % area.perRow;
      const nodeId = generateNodeId();
      
      result.nodes.push(
        createResourceNode(
          nodeId,
          api.properties?.Name || `API Gateway ${index + 1}`,
          NODE_TYPES.API_GATEWAY as string,
          api.apiId,
          undefined,
          area.x + (col * area.spacing),
          area.y + (row * area.spacing),
          {
            ApiId: api.apiId,
            ...api.properties
          }
        )
      );
    });
  }

  // Process SQS Queues
  if (awsData.sqsQueues && awsData.sqsQueues.length > 0) {
    awsData.sqsQueues.forEach((queue, index) => {
      const area = layoutAreas.sqs;
      const row = Math.floor(index / area.perRow);
      const col = index % area.perRow;
      const nodeId = generateNodeId();
      
      result.nodes.push(
        createResourceNode(
          nodeId,
          queue.properties?.QueueName || `Queue ${index + 1}`,
          NODE_TYPES.SQS as string,
          queue.queueUrl,
          undefined,
          area.x + (col * area.spacing),
          area.y + (row * area.spacing),
          {
            QueueUrl: queue.queueUrl,
            ...queue.properties
          }
        )
      );
    });
  }

  // Process SNS Topics
  if (awsData.snsTopics && awsData.snsTopics.length > 0) {
    awsData.snsTopics.forEach((topic, index) => {
      const area = layoutAreas.sns;
      const row = Math.floor(index / area.perRow);
      const col = index % area.perRow;
      const nodeId = generateNodeId();
      
      result.nodes.push(
        createResourceNode(
          nodeId,
          topic.properties?.TopicName || `Topic ${index + 1}`,
          NODE_TYPES.SNS as string,
          topic.topicArn,
          undefined,
          area.x + (col * area.spacing),
          area.y + (row * area.spacing),
          {
            TopicArn: topic.topicArn,
            ...topic.properties
          }
        )
      );
    });
  }

  // Additional resources can be processed similarly
  // This pattern can be extended for each resource type
} 