import { ConversionResult } from '../types';
import { createResourceNode } from '../utils/nodeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent,
  createGlobalResourcesContainer,
  updateContainerDimensions
} from './baseProcessor';
import { NODE_TYPES } from '../constants';
import { AWSNode } from '../awsNodes';

/**
 * Processor for AWS S3 bucket resources
 */
export default class S3Processor implements ResourceProcessor {
  /**
   * Process S3 bucket resources
   */
  process(
    buckets: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    x: number = 50, // Default x position for global resources
    y: number = 50 // Default y position for global resources
  ): void {
    if (!buckets || buckets.length === 0) return;
    
    const { nodes } = result;
    
    // Create a container for S3 buckets
    const containerId = createGlobalResourcesContainer(
      result,
      generateNodeId,
      'S3 Buckets',
      x,
      y,
      true, // Skip header for S3 buckets
      NODE_TYPES.S3 // Use S3 type for correct logo and color
    );
    
    // Process each S3 bucket
    buckets.forEach((bucket, index) => {
      // Create S3 bucket node ID
      const bucketId = getResourceId('s3', bucket.name, generateNodeId);
      
      // Create S3 bucket node with explicit parent relationship
      const s3Node: AWSNode = {
        id: bucketId,
        type: NODE_TYPES.S3,
        position: { x: 0, y: 0 }, // Will be positioned by positionNodeInParent
        data: {
          label: bucket.name || `S3 Bucket ${index + 1}`,
          type: NODE_TYPES.S3,
          resourceId: bucketId,
          Name: bucket.name || '',
          CreationDate: bucket.creationDate || bucket.properties?.CreationDate || ''
        },
        parentNode: containerId,
        extent: 'parent' as const,
        style: {
          width: 200,
          height: 100
        }
      };
      
      // Add S3 bucket node to results
      nodes.push(s3Node);
      
      // Position the S3 bucket within the container
      positionNodeInParent(s3Node, nodes, containerId);
    });
    
    // Ensure container has proper dimensions for all children
    updateContainerDimensions(nodes, [containerId]);
  }
} 