import { ConversionResult } from '../types';
import { createResourceNode } from '../utils/nodeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent,
  createGlobalResourcesContainer,
  updateContainerDimensions
} from './baseProcessor';

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
      y
    );
    
    // Process each S3 bucket
    buckets.forEach((bucket, index) => {
      // Create S3 bucket node ID
      const bucketId = getResourceId('s3', bucket.name, generateNodeId);
      
      // Create S3 bucket node
      const s3Node = createResourceNode(
        bucketId,
        bucket.name || `S3 Bucket ${index + 1}`,
        's3',
        bucketId,
        containerId, // Now a child of the global container
        0, 0, // Position will be updated by positionNodeInParent
        {
          Name: bucket.name || '',
          CreationDate: bucket.creationDate || bucket.properties?.CreationDate || ''
        }
      );
      
      // Add S3 bucket node to results
      nodes.push(s3Node);
      
      // Position the S3 bucket within the container
      positionNodeInParent(s3Node, nodes, containerId);
    });
    
    // Ensure container has proper dimensions for all children
    updateContainerDimensions(nodes, [containerId]);
  }
} 