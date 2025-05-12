import { AWSNode as AWSNodeType } from '../awsNodes';
import { LAYOUT } from './transformUtils';

/**
 * Utilities for positioning AWS diagram nodes with proper parent-child relationships
 */

/**
 * Position a child node relative to its parent
 * @param parentNode The parent node
 * @param childIndex Index of the child in the collection
 * @param totalChildren Total number of children
 * @param headerHeight Height of the parent header section
 * @returns Position coordinates {x, y}
 */
export function positionChildInParent(
  parentNode: AWSNodeType,
  childIndex: number,
  totalChildren: number,
  headerHeight: number = 60  // Default header height
): { x: number, y: number } {
  // Get parent dimensions
  const parentWidth = (parentNode.style?.width as number) || 800;
  const padding = 20; // Fixed padding
  
  // Handle VPC and subnets differently
  if (parentNode.data.type === 'vpc') {
    // For VPC children (subnets), align them with the parent's info card
    // Directly below the info card with aligned left edge
    
    // VPC info card setup:
    const vpcInfoCardWidth = 300;  // Width of info card
    const vpcInfoCardHeight = 120; // Height of info card
    const infoCardXPosition = padding;
    
    // For VPC, position subnets directly below the info card
    // Use a simple grid layout that maintains alignment with info card
    // Determine columns based on how many subnets we have
    const columns = 1; // One column to align with the info card
    const row = childIndex;
    const col = 0; // Always in the first column to align with the info card
    
    // Calculate position
    return {
      x: infoCardXPosition, // Align with left edge of info card
      y: vpcInfoCardHeight + padding + (row * (200 + padding)) // 200px is subnet height
    };
  } 
  else if (parentNode.data.type === 'subnet') {
    // For subnet children (EC2, etc.), align with the subnet info card
    // and stack them below it
    
    // Subnet info card dimensions
    const subnetInfoCardWidth = 300;  // Width of subnet info card
    const subnetInfoCardHeight = 100; // Height of subnet info card
    const infoCardXPosition = padding;
    
    // Calculate position - directly below the subnet info card
    return {
      x: infoCardXPosition, // Align with left edge of subnet info card
      y: subnetInfoCardHeight + padding + (childIndex * (80 + 10)) // 80px is resource height, 10px margin
    };
  }
  else {
    // For other node types, use default grid layout
    // Calculate columns based on parent width and children count
    const itemWidth = 200; // Fixed item width
    const itemMargin = 20; // Fixed margin
    const maxColumns = Math.max(1, Math.floor((parentWidth - padding * 2) / (itemWidth + itemMargin)));
    
    // Determine optimal columns (fewer for small counts)
    let columns = maxColumns;
    if (totalChildren <= 3) columns = Math.min(totalChildren, 2);
    else if (totalChildren <= 6) columns = Math.min(totalChildren, 3);
    else columns = Math.min(totalChildren, maxColumns);
    
    // Calculate row and column for this index
    const row = Math.floor(childIndex / columns);
    const col = childIndex % columns;
    
    // Use a default vertical offset
    const verticalOffset = headerHeight;
    
    // Calculate position relative to parent
    return {
      x: padding + (col * (itemWidth + itemMargin)),
      y: verticalOffset + (row * (80 + itemMargin)) // 80px standard resource height
    };
  }
}

/**
 * Find all direct children of a node
 * @param parentId The parent node ID
 * @param allNodes All nodes in the diagram
 * @returns Array of child nodes
 */
export function findChildNodes(parentId: string, allNodes: AWSNodeType[]): AWSNodeType[] {
  return allNodes.filter(node => node.parentNode === parentId);
}

/**
 * Calculate the required dimensions to fit all child nodes
 * @param childNodes Array of child nodes
 * @param padding Padding to add around children
 * @returns Required width and height
 */
export function calculateContainerSize(
  childNodes: AWSNodeType[],
  padding: number = 40 // Default padding (20px * 2)
): { width: number, height: number } {
  if (childNodes.length === 0) {
    return { width: 400, height: 300 };
  }
  
  // Find the boundaries of child nodes
  let maxRight = 0;
  let maxBottom = 0;
  
  childNodes.forEach(node => {
    const nodeRight = node.position.x + ((node.style?.width as number) || 200); // Default width 200px
    const nodeBottom = node.position.y + ((node.style?.height as number) || 80); // Default height 80px
    
    maxRight = Math.max(maxRight, nodeRight);
    maxBottom = Math.max(maxBottom, nodeBottom);
  });
  
  // Calculate dimensions with padding
  return {
    width: maxRight + padding,
    height: maxBottom + padding
  };
}

/**
 * Recursively update parent dimensions based on children
 * @param nodes All nodes in the diagram
 * @param startingParentIds Parent IDs to start the process from
 */
export function updateParentDimensions(
  nodes: AWSNodeType[],
  startingParentIds: string[]
): AWSNodeType[] {
  // Create a map of parent to children
  const parentChildMap: Record<string, string[]> = {};
  
  // Build the hierarchy
  nodes.forEach(node => {
    if (node.parentNode) {
      if (!parentChildMap[node.parentNode]) {
        parentChildMap[node.parentNode] = [];
      }
      parentChildMap[node.parentNode].push(node.id);
    }
  });
  
  // Process each starting parent
  startingParentIds.forEach(parentId => {
    resizeParentBasedOnChildren(parentId, nodes, parentChildMap);
  });
  
  return [...nodes]; // Return a new array to trigger React updates
}

/**
 * Resize a parent node based on its children
 * @param parentId The parent node ID
 * @param nodes All nodes in the diagram
 * @param parentChildMap Map of parent IDs to child IDs
 */
function resizeParentBasedOnChildren(
  parentId: string,
  nodes: AWSNodeType[],
  parentChildMap: Record<string, string[]>
): void {
  // Get the parent node
  const parentIndex = nodes.findIndex(node => node.id === parentId);
  if (parentIndex === -1) return;
  
  // Get all direct children
  const childIds = parentChildMap[parentId] || [];
  const childNodes = childIds.map(id => nodes.find(node => node.id === id)).filter(Boolean) as AWSNodeType[];
  
  if (childNodes.length === 0) return;
  
  // Calculate required size
  const minWidth = nodes[parentIndex].style?.width as number || 400;
  const minHeight = nodes[parentIndex].style?.height as number || 300;
  
  const { width, height } = calculateContainerSize(childNodes);
  
  // Update parent size
  nodes[parentIndex] = {
    ...nodes[parentIndex],
    style: {
      ...nodes[parentIndex].style,
      width: Math.max(minWidth, width),
      height: Math.max(minHeight, height)
    }
  };
  
  // Continue with parent's parent if exists
  const parentNodeId = nodes[parentIndex].parentNode;
  if (parentNodeId) {
    resizeParentBasedOnChildren(parentNodeId, nodes, parentChildMap);
  }
} 