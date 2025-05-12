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
  // Here you would add processing for global resources like:
  // - S3 buckets
  // - IAM roles/users/policies
  // - Route53 domains
  // - CloudFront distributions
  // etc.
  
  // For example, if the data model includes these:
  // processS3Buckets(awsData.s3Buckets || [], result);
  // processIamResources(awsData.iamResources || {}, result);
  
  // These would be implemented in separate processor classes
} 