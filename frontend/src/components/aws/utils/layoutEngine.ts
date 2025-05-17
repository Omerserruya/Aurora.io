import { Node } from 'reactflow';
import { AWSNode as AWSNodeType } from '../awsNodes';
import { Z_INDEX, NODE_DIMENSIONS, NODE_TYPES, GLOBAL_LAYOUT } from './constants';

/**
 * Utility functions for positioning AWS diagram nodes with proper parent-child relationships
 */

/**
 * Position a child node relative to its parent node's info card
 * @param parentNode The parent node
 * @param childIndex Index of the child in the collection
 * @param totalChildren Total number of children
 * @returns Position coordinates {x, y}
 */
export function positionChildNode(
  parentNode: AWSNodeType,
  childIndex: number,
  totalChildren: number
): { x: number, y: number } {
  const parentType = parentNode.data.type;
  const padding = getNodePadding(parentType);
  
  // VPC special case - position subnets below the VPC info card with more spacing
  if (parentType === NODE_TYPES.VPC) {
    const infoCardHeight = NODE_DIMENSIONS.VPC.INFO_CARD_HEIGHT;
    const subnetHeight = NODE_DIMENSIONS.SUBNET.DEFAULT_HEIGHT;
    const margin = NODE_DIMENSIONS.RESOURCE.MARGIN * 3; // Triple the margin for more space
    
    return {
      x: padding + 40, // Additional left padding to prevent sticking to the edge
      y: infoCardHeight + padding + 60 + (childIndex * (subnetHeight + margin)) // Add extra 60px of spacing from info card
    };
  }
  
  // Subnet special case - position resources below the subnet info card with more spacing
  if (parentType === NODE_TYPES.SUBNET) {
    const infoCardHeight = NODE_DIMENSIONS.SUBNET.INFO_CARD_HEIGHT;
    const resourceHeight = NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT;
    const margin = NODE_DIMENSIONS.RESOURCE.MARGIN * 2; // Double the margin
    
    return {
      x: padding + 20, // Additional left padding
      y: infoCardHeight + padding + 40 + (childIndex * (resourceHeight + margin)) // Add extra 40px spacing from info card
    };
  }
  
  // Default positioning for other node types - use an improved grid layout
  const parentWidth = (parentNode.style?.width as number) || 
    getDefaultNodeWidth(parentType);
  
  const itemWidth = NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH;
  const itemHeight = NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT;
  const itemMargin = NODE_DIMENSIONS.RESOURCE.MARGIN;
  const availableWidth = parentWidth - (padding * 2) - 40; // Extra 40px margin for better spacing
  
  // Calculate max columns that can fit in the available width
  const maxColumns = Math.max(1, Math.floor(availableWidth / (itemWidth + itemMargin)));
  
  // Adaptive column count based on number of children
  let columns: number;
  if (totalChildren <= 2) columns = 1;
  else if (totalChildren <= 4) columns = 2;
  else if (totalChildren <= 8) columns = 3;
  else columns = Math.min(totalChildren, maxColumns, 4); // Cap at 4 columns max for readability
  
  // Calculate row and column for this index
  const row = Math.floor(childIndex / columns);
  const col = childIndex % columns;
  
  // Calculate optimal spacing to utilize available width
  const totalItemsWidth = columns * itemWidth;
  const totalSpacing = availableWidth - totalItemsWidth;
  const horizontalSpacing = columns > 1 ? totalSpacing / (columns - 1) : itemMargin;
  
  // Calculate position based on grid with optimal spacing
  return {
    x: padding + 20 + (col * (itemWidth + horizontalSpacing)),
    y: padding + 20 + (row * (itemHeight + itemMargin))
  };
}

/**
 * Get the default padding for a node type
 */
function getNodePadding(nodeType: string): number {
  switch (nodeType) {
    case NODE_TYPES.VPC:
      return 40;
    case NODE_TYPES.SUBNET:
      return 30;
    default:
      return 20;
  }
}

/**
 * Get the default width for a node type
 */
function getDefaultNodeWidth(nodeType: string): number {
  switch (nodeType) {
    case NODE_TYPES.VPC:
      return 1200;
    case NODE_TYPES.SUBNET:
      return 800;
    case NODE_TYPES.EC2:
      return 400;
    case NODE_TYPES.SECURITY_GROUP:
      return 400;
    case NODE_TYPES.S3:
      return 400;
    case NODE_TYPES.ROUTE_TABLE:
      return 400;
    case NODE_TYPES.INTERNET_GATEWAY:
      return 400;
    case NODE_TYPES.NAT_GATEWAY:
      return 400;
    case NODE_TYPES.NETWORK_ACL:
      return 400;
    case NODE_TYPES.ELASTIC_IP:
      return 400;
    case NODE_TYPES.TRANSIT_GATEWAY:
      return 400;
    case NODE_TYPES.LOAD_BALANCER:
      return 400;
    case NODE_TYPES.ECS_CLUSTER:
      return 400;
    case NODE_TYPES.ECS_TASK:
      return 400;
    case NODE_TYPES.LAMBDA_FUNCTION:
      return 400;
    case NODE_TYPES.IAM_ROLE:
      return 400;
    case NODE_TYPES.IAM_USER:
      return 400;
    case NODE_TYPES.IAM_POLICY:
      return 400;
    case NODE_TYPES.HEADER:
      return 400;
    default:
      return 400;
  }
}

/**
 * Get the default height for a node type
 */
function getDefaultNodeHeight(nodeType: string): number {
  switch (nodeType) {
    case NODE_TYPES.VPC:
      return 1000;
    case NODE_TYPES.SUBNET:
      return 500;
    case NODE_TYPES.EC2:
      return 200;
    case NODE_TYPES.SECURITY_GROUP:
      return 200;
    case NODE_TYPES.S3:
      return 200;
    case NODE_TYPES.ROUTE_TABLE:
      return 200;
    case NODE_TYPES.INTERNET_GATEWAY:
      return 200;
    case NODE_TYPES.NAT_GATEWAY:
      return 200;
    case NODE_TYPES.NETWORK_ACL:
      return 200;
    case NODE_TYPES.ELASTIC_IP:
      return 200;
    case NODE_TYPES.TRANSIT_GATEWAY:
      return 200;
    case NODE_TYPES.LOAD_BALANCER:
      return 200;
    case NODE_TYPES.ECS_CLUSTER:
      return 200;
    case NODE_TYPES.ECS_TASK:
      return 200;
    case NODE_TYPES.LAMBDA_FUNCTION:
      return 200;
    case NODE_TYPES.IAM_ROLE:
      return 200;
    case NODE_TYPES.IAM_USER:
      return 200;
    case NODE_TYPES.IAM_POLICY:
      return 200;
    case NODE_TYPES.HEADER:
      return 200;
    default:
      return 200;
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
  nodeType: string
): { width: number, height: number } {
  if (childNodes.length === 0) {
    return getDefaultDimensions(nodeType);
  }
  
  // Default padding for container
  const padding = getNodePadding(nodeType) * 2;
  
  // Find the boundaries of child nodes
  let maxRight = 0;
  let maxBottom = 0;
  
  childNodes.forEach(node => {
    const nodeWidth = (node.style?.width as number) || 
      getDefaultNodeWidth(node.data.type);
    const nodeHeight = (node.style?.height as number) || 
      getDefaultNodeHeight(node.data.type);
    
    const nodeRight = node.position.x + nodeWidth;
    const nodeBottom = node.position.y + nodeHeight;
    
    maxRight = Math.max(maxRight, nodeRight);
    maxBottom = Math.max(maxBottom, nodeBottom);
  });
  
  // Add info card height for container nodes
  const infoCardHeight = nodeType === NODE_TYPES.VPC 
    ? NODE_DIMENSIONS.VPC.INFO_CARD_HEIGHT 
    : nodeType === NODE_TYPES.SUBNET 
      ? NODE_DIMENSIONS.SUBNET.INFO_CARD_HEIGHT 
      : 0;
  
  // Calculate dimensions with padding
  return {
    width: Math.max(getDefaultNodeWidth(nodeType), maxRight + padding),
    height: Math.max(getDefaultNodeHeight(nodeType), maxBottom + padding + infoCardHeight)
  };
}

/**
 * Get default dimensions for a node type
 */
function getDefaultDimensions(nodeType: string): { width: number, height: number } {
  switch (nodeType) {
    case NODE_TYPES.VPC:
      return { 
        width: NODE_DIMENSIONS.VPC.DEFAULT_WIDTH, 
        height: NODE_DIMENSIONS.VPC.DEFAULT_HEIGHT 
      };
    case NODE_TYPES.SUBNET:
      return { 
        width: NODE_DIMENSIONS.SUBNET.DEFAULT_WIDTH, 
        height: NODE_DIMENSIONS.SUBNET.DEFAULT_HEIGHT 
      };
    case NODE_TYPES.HEADER:
      return { 
        width: NODE_DIMENSIONS.HEADER.DEFAULT_WIDTH, 
        height: NODE_DIMENSIONS.HEADER.DEFAULT_HEIGHT 
      };
    default:
      return { 
        width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH, 
        height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT 
      };
  }
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
  
  const parentNodeType = nodes[parentIndex].data.type;
  
  // Calculate required size
  const minWidth = getDefaultNodeWidth(parentNodeType);
  const minHeight = getDefaultNodeHeight(parentNodeType);
  
  const { width, height } = calculateContainerSize(childNodes, parentNodeType);
  
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

// Calculate VPC positions in a grid - SIDE BY SIDE with NO OVERLAP
export const calculateVpcPositions = (vpcs: AWSNodeType[], dimensions = GLOBAL_LAYOUT) => {
  const vpcPositions: Record<string, { x: number, y: number }> = {};
  
  // Assign fixed positions to each VPC with balanced spacing
  vpcs.forEach((vpc, index) => {
    // Use a simple layout - alternate between left and right columns
    const row = Math.floor(index / 2);
    const col = index % 2;
    
    // Increase horizontal spacing to create clear separation
    // First column starts at x=50, second at x=1500
    const xPos = col === 0 ? 50 : 1500;
    const yPos = 50 + (row * 950); // Slightly more vertical space
    
    // Store the position for this VPC
    vpcPositions[vpc.id] = { x: xPos, y: yPos };
    
    // Update the VPC with its fixed position
    vpc.position = { x: xPos, y: yPos };
    
    // Ensure VPCs are independent nodes
    vpc.parentNode = undefined;
    vpc.extent = undefined;
  });
  
  return vpcs;
};

// Update the main layout function to use grid layout for VPCs
export const calculateLayout = (nodes: AWSNodeType[], edges: any[]): { nodes: AWSNodeType[], edges: any[] } => {
  // Find all VPC nodes
  const vpcs = nodes.filter(node => node.data.type === NODE_TYPES.VPC);
  
  if (vpcs.length === 0) {
    return { nodes, edges };
  }
  
  // Calculate positions for VPCs in a grid layout with explicit positions
  const positionedVpcs = calculateVpcPositions(vpcs);
  
  // Create a map for quick VPC ID lookup
  const vpcMap = new Map();
  positionedVpcs.forEach(vpc => {
    vpcMap.set(vpc.id, vpc);
  });
  
  // Create a new array with the updated nodes
  const updatedNodes = nodes.map(node => {
    // For VPC nodes, use their pre-calculated positions
    if (node.data.type === NODE_TYPES.VPC) {
      const positionedVpc = vpcMap.get(node.id);
      if (positionedVpc) {
        return {
          ...node,
          position: { ...positionedVpc.position },
          parentNode: undefined, // VPCs have no parent
          extent: undefined, // VPCs are not restricted to an extent
          // Force dimensions to be explicit
          style: {
            ...node.style,
            width: NODE_DIMENSIONS.VPC.DEFAULT_WIDTH,
            height: NODE_DIMENSIONS.VPC.DEFAULT_HEIGHT
          },
          draggable: true // Allow VPCs to be individually dragged
        };
      }
    }
    
    // For non-VPC nodes, maintain their relationship with parent VPCs
    return node;
  });
  
  // Process the nodes to ensure parent-child relationships are maintained for subnet nodes
  const parentIds = Array.from(new Set(updatedNodes
    .filter(node => node.parentNode && node.data.type !== NODE_TYPES.VPC)
    .map(node => node.parentNode as string)));
  
  // Return the updated nodes and edges
  const finalNodes = updateParentDimensions(updatedNodes, parentIds);
  
  return {
    nodes: finalNodes,
    edges
  };
}; 