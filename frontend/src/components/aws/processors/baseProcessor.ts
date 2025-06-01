import { AWSNode as AWSNodeType } from '../awsNodes';
import { AWSEdge } from '../awsEdges';
import { ConversionResult, RelationshipType } from '../types';
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
  const position = positionChildNode(parentNode, childIndex, siblings.length, allNodes);
  childNode.position = position;
}

/**
 * Helper function to create relationships between resources
 */
export function createResourceRelationship(
  edges: AWSEdge[],
  sourceId: string,
  targetId: string,
  type: RelationshipType,
  description: string,
  generateEdgeId: () => string
): void {
  edges.push(
    createRelationship(
      sourceId,
      targetId,
      type,
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
  y: number = GLOBAL_LAYOUT.Y_START,
  skipHeader: boolean = false,
  type: string = 'global_container'
): string {
  const containerId = `global-resources-${generateNodeId()}`;
  
  // Create container node for global resources
  const containerNode: AWSNodeType = {
    id: containerId,
    type: type,
    position: { x, y },
    style: {
      width: NODE_DIMENSIONS.VPC.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.VPC.DEFAULT_HEIGHT,
      zIndex: 4, // Below VPC z-index
    },
    data: {
      label: title,
      type: type,
      resourceId: containerId,
      isGlobal: true
    }
  };
  
  // Add header node only if not skipped
  if (!skipHeader) {
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
        resourceId: headerId,
        parentType: type
      }
    };
    result.nodes.push(headerNode);
  }
  
  result.nodes.push(containerNode);
  
  return containerId;
}

/**
 * Create a group header text for a resource type
 */
export function createGroupHeader(
  result: ConversionResult,
  generateNodeId: () => string,
  parentId: string,
  resourceType: string,
  count: number
): void {
  const headerId = `group-header-${resourceType}-${generateNodeId()}`;
  const headerNode: AWSNodeType = {
    id: headerId,
    type: 'group_header',
    position: { x: 0, y: 0 }, // Will be positioned by layout engine
    parentNode: parentId,
    extent: 'parent',
    style: {
      width: '100%',
      height: 30,
      zIndex: 5,
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#666',
      padding: '5px 10px',
      backgroundColor: 'transparent'
    },
    data: {
      label: `${resourceType} (${count})`,
      type: 'group_header',
      resourceId: headerId,
      parentType: resourceType,
      isHeader: true
    }
  };
  
  result.nodes.push(headerNode);
}

/**
 * Create group headers for all resource types in a container
 */
export function createGroupHeaders(
  result: ConversionResult,
  generateNodeId: () => string,
  parentId: string,
  allNodes: AWSNodeType[]
): void {
  // Get all children of the parent
  const children = findChildNodes(parentId, allNodes);
  
  // Group children by type
  const childrenByType: Record<string, AWSNodeType[]> = {};
  children.forEach(node => {
    if (node && node.data && node.data.type) {
      const type = node.data.type;
      if (!childrenByType[type]) {
        childrenByType[type] = [];
      }
      childrenByType[type].push(node);
    }
  });
  
  // Find parent node
  const parentNode = result.nodes.find(node => node.id === parentId);
  if (!parentNode) return;

  // Add group headers to parent node data
  parentNode.data.groupHeaders = Object.entries(childrenByType).map(([type, nodes]) => ({
    type,
    count: nodes.length
  }));
} 