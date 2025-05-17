import { AWSArchitecture } from '../../aws-architecture-visualizer';
import { ConversionResult } from '../types';
import VpcProcessor from '../processors/vpcProcessor';
import { resetEdgeIdCounter, generateEdgeId } from './edgeFactory';

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
export function convertAwsDataToFlow(awsData: AWSArchitecture): ConversionResult {
  // Reset ID counters to ensure fresh IDs for each conversion
  resetIdCounters();
  
  // Initialize result
  const result: ConversionResult = {
    nodes: [],
    edges: []
  };
  
  // Process VPC resources (which will cascade to subnets, EC2, etc.)
  if (awsData.vpcs && awsData.vpcs.length > 0) {
    const vpcProcessor = new VpcProcessor();
    // Pass all the VPC-related resources for processing
    vpcProcessor.process(awsData.vpcs, result, generateNodeId, generateEdgeId);
  }
  
  // Process global resources (not in VPCs)
  processGlobalResources(awsData, result);
  
  return result;
}

/**
 * Process resources that aren't part of a VPC
 */
function processGlobalResources(
  awsData: AWSArchitecture,
  result: ConversionResult
): void {
  // Process S3 buckets if available
  if (awsData.s3Buckets && awsData.s3Buckets.length > 0) {
    processS3Buckets(awsData.s3Buckets, result);
  }
  
  // Process IAM resources if available
  if (awsData.iamRoles || awsData.iamUsers || awsData.iamPolicies) {
    processIamResources(awsData, result);
  }
}

/**
 * Process S3 buckets
 */
function processS3Buckets(
  buckets: any[],
  result: ConversionResult
): void {
  // Position buckets in a horizontal line at the bottom
  const bucketStartX = 100;
  const bucketY = 800;
  const bucketSpacing = 200;
  
  buckets.forEach((bucket, index) => {
    const nodeId = generateNodeId();
    result.nodes.push({
      id: nodeId,
      type: 'awsS3Bucket',
      position: { x: bucketStartX + (index * bucketSpacing), y: bucketY },
      data: {
        label: bucket.name,
        name: bucket.name,
        resource: bucket
      }
    });
  });
}

/**
 * Process IAM resources
 */
function processIamResources(
  awsData: AWSArchitecture,
  result: ConversionResult
): void {
  // Position IAM resources in a horizontal line at the top
  const iamStartX = 100;
  const iamY = 50;
  const iamSpacing = 200;
  
  // Process roles
  if (awsData.iamRoles) {
    awsData.iamRoles.forEach((role, index) => {
      const nodeId = generateNodeId();
      result.nodes.push({
        id: nodeId,
        type: 'awsIAMRole',
        position: { x: iamStartX + (index * iamSpacing), y: iamY },
        data: {
          label: role.roleName,
          name: role.roleName,
          resource: role
        }
      });
    });
  }
  
  // Process users
  if (awsData.iamUsers) {
    awsData.iamUsers.forEach((user, index) => {
      const nodeId = generateNodeId();
      result.nodes.push({
        id: nodeId,
        type: 'awsIAMUser',
        position: { x: iamStartX + (index * iamSpacing), y: iamY + 120 },
        data: {
          label: user.userName,
          name: user.userName,
          resource: user
        }
      });
    });
  }
  
  // Process policies
  if (awsData.iamPolicies) {
    awsData.iamPolicies.forEach((policy, index) => {
      const nodeId = generateNodeId();
      result.nodes.push({
        id: nodeId,
        type: 'awsIAMPolicy',
        position: { x: iamStartX + (index * iamSpacing), y: iamY + 240 },
        data: {
          label: policy.policyName,
          name: policy.policyName,
          resource: policy
        }
      });
    });
  }
} 