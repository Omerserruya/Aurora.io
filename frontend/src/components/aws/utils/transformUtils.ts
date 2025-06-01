import { AWSEdge, RelationshipType } from '../awsEdges';
import { AWSNode as AWSNodeType } from '../awsNodes';
import { RelationshipType as RelationshipTypeType } from '../types';

// Define SectionBottoms interface locally
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
  [key: string]: number;
}

// Utility functions for creating relationships between AWS resources
export const createResourceRelationship = (
  edges: AWSEdge[],
  sourceId: string,
  targetId: string,
  type: RelationshipType,
  description: string,
  edgeIdGenerator: () => string
) => {
  edges.push({
    id: edgeIdGenerator(),
    source: sourceId,
    target: targetId,
    type: 'smoothstep',
    data: {
      type,
      description
    }
  });
};

// Find related resources by property matching
export const findResourcesByProperty = <T extends AWSNodeType>(
  nodes: AWSNodeType[],
  propertyName: string,
  propertyValue: string,
  typeGuard: (node: AWSNodeType) => node is T
): T[] => {
  return nodes.filter(node => 
    typeGuard(node) && 
    (node.data as any)[propertyName] === propertyValue
  ) as T[];
};

// Create a section header
export const createSectionHeader = (
  id: string, 
  parentId: string | undefined,
  x: number, 
  y: number, 
  title: string
): AWSNodeType => {
  return {
    id,
    type: 'header',
    position: { x, y },
    parentId,
    extent: parentId ? 'parent' : undefined,
    hidden: false,
    selectable: false,
    style: { 
      width: 250,
      height: 30,
      padding: 0,
      borderWidth: 0,
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
      backgroundColor: 'transparent'
    },
    data: {
      label: title,
      type: 'header',
      resourceId: id
    }
  };
};

// Initialize a SectionBottoms object
export const initializeSectionBottoms = (): SectionBottoms => {
  return {
    vpc_info: 0,
    igw: 0,
    subnets: 0,
    routeTables: 0,
    securityGroups: 0,
    networkAcls: 0,
    elasticIPs: 0,
    transitGateways: 0,
    lambdaFunctions: 0,
    ecsClusters: 0
  };
};

// Layout management constants
export const LAYOUT = {
  // Z-index values for proper layering
  Z_INDEX: {
    CONTAINER: 1,
    HEADER: 3,
    RESOURCE: 5,
    SELECTED: 10
  },
  
  // Base sizes as percentages of parent containers
  RELATIVE: {
    PARENT_PADDING_PERCENT: 2,   // Padding as percentage of parent
    HEADER_HEIGHT_PERCENT: 30,   // Header height as percentage of parent height
    NODE_WIDTH_PERCENT: 25,      // Node width as percentage of available width
    NODE_SPACING_PERCENT: 2      // Spacing as percentage of container
  }
};

/**
 * Calculate the optimal layout for items within a container
 * @param containerWidth The available width of the container
 * @param itemCount The number of items to layout
 * @returns Layout information including columns, rows, and dimensions
 */
export function calculateGridLayout(containerWidth: number, itemCount: number) {
  if (itemCount === 0) return { columns: 0, rows: 0, itemWidth: 0, padding: 0, itemMargin: 0 };
  
  // Calculate padding as percentage of container width
  const paddingPercent = LAYOUT.RELATIVE.PARENT_PADDING_PERCENT;
  const padding = (containerWidth * paddingPercent) / 100;
  
  // Calculate available width for content
  const availableWidth = containerWidth - (padding * 2);
  
  // Calculate margin as percentage of available width
  const marginPercent = LAYOUT.RELATIVE.NODE_SPACING_PERCENT;
  const itemMargin = (availableWidth * marginPercent) / 100;
  
  // Calculate max columns based on relative sizing
  const minNodeWidthPercent = LAYOUT.RELATIVE.NODE_WIDTH_PERCENT;
  const minNodeWidth = (availableWidth * minNodeWidthPercent) / 100;
  
  // Determine columns based on available space
  const maxPossibleColumns = Math.max(1, Math.floor(availableWidth / (minNodeWidth + itemMargin)));
  
  // For a small number of items, use fewer columns to balance the layout
  let columns = maxPossibleColumns;
  if (itemCount <= 3) columns = Math.min(itemCount, 2);
  else if (itemCount <= 6) columns = Math.min(itemCount, 3);
  else columns = Math.min(itemCount, maxPossibleColumns);
  
  // Calculate rows needed
  const rows = Math.ceil(itemCount / columns);
  
  // Calculate actual item width to distribute space
  const totalMarginWidth = itemMargin * (columns - 1);
  const itemWidth = (availableWidth - totalMarginWidth) / columns;
  
  return {
    columns,
    rows,
    itemWidth,
    totalWidth: containerWidth,
    padding,
    itemMargin
  };
}

/**
 * Calculate the position for an item in a grid layout
 * @param index The index of the item in the collection
 * @param layout The layout information from calculateGridLayout
 * @param parentHeight The parent container's height
 * @param parentWidth The parent container's width
 * @returns The x,y position coordinates
 */
export function calculateItemPosition(
  index: number, 
  layout: { columns: number, padding: number, itemWidth: number, itemMargin: number },
  parentHeight: number,
  parentWidth: number
) {
  const { columns, padding, itemWidth, itemMargin } = layout;
  
  // Calculate row and column for this index
  const row = Math.floor(index / columns);
  const col = index % columns;
  
  // Calculate header height as percentage of parent height
  const headerHeightPercent = LAYOUT.RELATIVE.HEADER_HEIGHT_PERCENT;
  const headerHeight = (parentHeight * headerHeightPercent) / 100;
  
  // Calculate x position with even spacing
  const x = padding + (col * (itemWidth + itemMargin));
  
  // Calculate y position - start below the header
  const y = headerHeight + (row * (itemWidth * 0.7 + itemMargin));
  
  return { x, y };
}

/**
 * Calculate dimensions for a parent node based on its children
 * @param childNodes Array of child nodes
 * @param parentWidth Parent container width
 * @param parentHeight Parent container height 
 * @returns Required width and height
 */
export function calculateParentDimensions(
  childNodes: AWSNodeType[],
  parentWidth: number = 800,
  parentHeight: number = 600
) {
  if (childNodes.length === 0) {
    return { width: parentWidth, height: parentHeight };
  }
  
  // Find the boundaries of child nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  childNodes.forEach(node => {
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    const nodeWidth = (node.style?.width as number) || parentWidth * 0.2;
    const nodeHeight = (node.style?.height as number) || parentHeight * 0.2;
    
    minX = Math.min(minX, nodeX);
    minY = Math.min(minY, nodeY);
    maxX = Math.max(maxX, nodeX + nodeWidth);
    maxY = Math.max(maxY, nodeY + nodeHeight);
  });
  
  // Calculate required dimensions with relative padding
  const paddingPercent = LAYOUT.RELATIVE.PARENT_PADDING_PERCENT;
  const padding = (parentWidth * paddingPercent) / 100;
  
  // Calculate header height
  const headerHeightPercent = LAYOUT.RELATIVE.HEADER_HEIGHT_PERCENT;
  const headerHeight = (parentHeight * headerHeightPercent) / 100;
  
  const width = Math.max(parentWidth, maxX - minX + padding * 2);
  const height = Math.max(parentHeight, maxY - minY + padding * 2 + headerHeight);
  
  return { width, height };
} 