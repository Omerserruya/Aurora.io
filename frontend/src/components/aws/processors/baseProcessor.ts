import { AWSNode as AWSNodeType } from '../awsNodes';
import { AWSEdge } from '../awsEdges';
import { ConversionResult } from '../types';
import { 
  positionChildNode, 
  updateParentDimensions, 
  findChildNodes
} from '../utils/layoutEngine';
import { createRelationship } from '../utils/edgeFactory';
import { NODE_DIMENSIONS, GLOBAL_LAYOUT } from '../utils/constants';

/**
 * Interface for resource processors
 */
export interface ResourceProcessor {
  process(
    data: any,
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void;
}

/**
 * Helper function to get a resource ID with a prefix
 */
export function getResourceId(prefix: string, resourceId: string, generateId: () => string): string {
  return resourceId ? `${prefix}-${resourceId}` : `${prefix}-${generateId()}`;
}

/**
 * Position a child node relative to its parent
 */
export function positionNodeInParent(
  childNode: AWSNodeType,
  allNodes: AWSNodeType[],
  parentId: string
): void {
  // Find parent node
  const parentNode = allNodes.find(node => node.id === parentId);
  if (!parentNode) return;
  
  // Find all children of this parent to determine index
  const siblings = findChildNodes(parentId, allNodes);
  const childIndex = siblings.findIndex(node => node.id === childNode.id);
  if (childIndex === -1) return;
  
  // Calculate position and update node
  const position = positionChildNode(parentNode, childIndex, siblings.length);
  childNode.position = position;
}

/**
 * Helper function to create relationships between resources
 */
export function createResourceRelationship(
  edges: AWSEdge[],
  sourceId: string,
  targetId: string,
  type: string,
  description: string,
  generateEdgeId: () => string
): void {
  edges.push(
    createRelationship(
      sourceId,
      targetId,
      type as any,
      description,
      generateEdgeId
    )
  );
}

/**
 * Update the dimensions of parent nodes after child nodes are added
 */
export function updateContainerDimensions(
  nodes: AWSNodeType[],
  containerIds: string[]
): void {
  updateParentDimensions(nodes, containerIds);
}

/**
 * Create a container for global resources that aren't in VPCs
 */
export function createGlobalResourcesContainer(
  result: ConversionResult,
  generateNodeId: () => string,
  title: string,
  x: number = GLOBAL_LAYOUT.X_START,
  y: number = GLOBAL_LAYOUT.Y_START
): string {
  const containerId = `global-resources-${generateNodeId()}`;
  
  // Create container node for global resources
  const containerNode: AWSNodeType = {
    id: containerId,
    type: 'vpc', // Reuse vpc type for consistent styling
    position: { x, y },
    style: {
      width: NODE_DIMENSIONS.VPC.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.VPC.DEFAULT_HEIGHT,
      zIndex: 4, // Below VPC z-index
      backgroundColor: '#f5f9ff', // Lighter background to distinguish from VPCs
      border: '2px dashed #ccd9ea' // Dashed border to indicate it's not a real VPC
    },
    data: {
      label: title,
      type: 'vpc',
      resourceId: containerId,
      VpcId: 'global',
      CidrBlock: ''
    }
  };
  
  // Add header node
  const headerId = `header-${generateNodeId()}`;
  const headerNode: AWSNodeType = {
    id: headerId,
    type: 'header',
    position: { x: 20, y: 20 },
    parentNode: containerId,
    extent: 'parent',
    style: {
      width: NODE_DIMENSIONS.HEADER.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.HEADER.DEFAULT_HEIGHT,
      zIndex: 7
    },
    data: {
      label: title,
      type: 'header',
      resourceId: headerId
    }
  };
  
  result.nodes.push(containerNode);
  result.nodes.push(headerNode);
  
  return containerId;
} 