import { Node } from 'reactflow';
import { AWSNode as AWSNodeType } from '../awsNodes';
import { Z_INDEX, NODE_DIMENSIONS, NODE_TYPES, GLOBAL_LAYOUT } from './constants';
import { AWSNode } from '../awsNodes';
import { AWSEdge } from '../awsEdges';
import { LAYOUT_CONFIG, ELK_LAYOUT_OPTIONS } from '../constants';
import ELK from 'elkjs/lib/elk.bundled.js';

/**
 * Utility functions for positioning AWS diagram nodes with proper parent-child relationships
 */

/**
 * Position a child node relative to its parent node
 * @param parentNode The parent node
 * @param childIndex Index of the child in the collection
 * @param totalChildren Total number of children
 * @param allNodes All nodes in the diagram
 * @returns Position coordinates {x, y}
 */
export function positionChildNode(
  parentNode: AWSNodeType,
  childIndex: number,
  totalChildren: number,
  allNodes: AWSNodeType[]
): { x: number, y: number } {
  const parentType = parentNode.data.type;
  const padding = getNodePadding(parentType);
  const headerHeight = parentType === NODE_TYPES.VPC 
    ? NODE_DIMENSIONS.VPC.INFO_CARD_HEIGHT 
    : parentType === NODE_TYPES.SUBNET 
      ? NODE_DIMENSIONS.SUBNET.INFO_CARD_HEIGHT 
      : 0;

  // Get all children of the parent using allNodes
  const allChildren = findChildNodes(parentNode.id, allNodes);
  if (!allChildren.length || childIndex >= allChildren.length) {
    return { x: padding, y: headerHeight + padding };
  }

  // Group children by type
  const childrenByType: Record<string, AWSNodeType[]> = {};
  allChildren.forEach(node => {
    if (node && node.data && node.data.type) {
      const type = node.data.type;
      if (!childrenByType[type]) {
        childrenByType[type] = [];
      }
      childrenByType[type].push(node);
    }
  });

  // Type order: subnets first for VPCs, S3 buckets first for S3 containers
  const typeOrder = (parentType === NODE_TYPES.VPC)
    ? [NODE_TYPES.SUBNET, ...Object.keys(childrenByType).filter(type => type !== NODE_TYPES.SUBNET).sort()]
    : (parentType === NODE_TYPES.S3)
      ? [NODE_TYPES.S3, ...Object.keys(childrenByType).filter(type => type !== NODE_TYPES.S3).sort()]
      : Object.keys(childrenByType).sort();

  // Find the group/type and index within group for this child
  let groupStartY = headerHeight + padding;
  let found = false;
  let x = padding;
  let y = groupStartY;

  for (let t = 0; t < typeOrder.length; t++) {
    const type = typeOrder[t];
    const group = childrenByType[type] || [];
    // Use fixed maxColumns for subnets and S3, else calculate as before
    let maxColumns = 3;
    if (type !== NODE_TYPES.SUBNET && type !== NODE_TYPES.S3) {
      maxColumns = Math.max(1, Math.floor((parentNode.style?.width as number - 2 * padding) / 250));
    }
    // --- Grid calculation ---
    // First pass: measure row heights and col widths
    let rowHeights: number[] = [];
    let maxColWidths: number[] = [];
    let col = 0;
    let maxRowHeight = 0;
    for (let i = 0; i < group.length; i++) {
      const node = group[i];
      const width = (node.style?.width as number) || 200;
      const height = (node.style?.height as number) || 100;
      if (!maxColWidths[col] || width > maxColWidths[col]) maxColWidths[col] = width;
      if (height > maxRowHeight) maxRowHeight = height;
      col++;
      if (col >= maxColumns) {
        rowHeights.push(maxRowHeight);
        maxRowHeight = 0;
        col = 0;
      }
    }
    if (col > 0) rowHeights.push(maxRowHeight);
    // Second pass: position
    let row = 0;
    col = 0;
    let curY = groupStartY;
    let rowStartX = padding;
    for (let i = 0; i < group.length; i++) {
      const node = group[i];
      const width = (node.style?.width as number) || 200;
      // Calculate x
      let xPos = rowStartX;
      for (let c = 0; c < col; c++) {
        xPos += (maxColWidths[c] || 200) + NODE_DIMENSIONS.RESOURCE.MARGIN;
      }
      // Calculate y
      let yPos = curY;
      // If this is the node we're positioning, set x/y
      if (!found && node.id === allChildren[childIndex].id) {
        x = xPos;
        y = yPos;
        found = true;
      }
      col++;
      if (col >= maxColumns) {
        col = 0;
        row++;
        curY += (rowHeights[row - 1] || 100) + NODE_DIMENSIONS.RESOURCE.MARGIN;
        rowStartX = padding;
      }
    }
    // After this group, move groupStartY down by total group height
    let groupHeight = rowHeights.reduce((a, b) => a + b, 0) + (rowHeights.length - 1) * NODE_DIMENSIONS.RESOURCE.MARGIN;
    groupStartY += 30 + 40 + groupHeight; // header + spacing + group height
    if (found) break;
  }
  return { x, y };
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
 * @param nodeType Type of the container node
 * @returns Required width and height
 */
export function calculateContainerSize(
  childNodes: AWSNodeType[],
  nodeType: string
): { width: number, height: number } {
  if (childNodes.length === 0) {
    return {
      width: NODE_DIMENSIONS.RESOURCE.DEFAULT_WIDTH,
      height: NODE_DIMENSIONS.RESOURCE.DEFAULT_HEIGHT
    };
  }
  const padding = getNodePadding(nodeType);
  // Group children by type
  const childrenByType: Record<string, AWSNodeType[]> = {};
  childNodes.forEach(node => {
    if (node && node.data && node.data.type) {
      const type = node.data.type;
      if (!childrenByType[type]) {
        childrenByType[type] = [];
      }
      childrenByType[type].push(node);
    }
  });
  const typeOrder = nodeType === NODE_TYPES.VPC
    ? [NODE_TYPES.SUBNET, ...Object.keys(childrenByType).filter(type => type !== NODE_TYPES.SUBNET).sort()]
    : Object.keys(childrenByType).sort();
  let totalHeight = (nodeType === NODE_TYPES.VPC ? NODE_DIMENSIONS.VPC.INFO_CARD_HEIGHT : nodeType === NODE_TYPES.SUBNET ? NODE_DIMENSIONS.SUBNET.INFO_CARD_HEIGHT : 0) + padding;
  let maxWidth = 0;
  for (let t = 0; t < typeOrder.length; t++) {
    const type = typeOrder[t];
    const group = childrenByType[type] || [];
    let maxColumns = 3;
    if (type !== NODE_TYPES.SUBNET) {
      maxColumns = Math.max(1, Math.floor((NODE_DIMENSIONS.VPC.DEFAULT_WIDTH - 2 * padding) / 250));
    }
    let rowHeights: number[] = [];
    let maxColWidths: number[] = [];
    let col = 0;
    let maxRowHeight = 0;
    for (let i = 0; i < group.length; i++) {
      const node = group[i];
      const width = (node.style?.width as number) || 200;
      const height = (node.style?.height as number) || 100;
      if (!maxColWidths[col] || width > maxColWidths[col]) maxColWidths[col] = width;
      if (height > maxRowHeight) maxRowHeight = height;
      col++;
      if (col >= maxColumns) {
        rowHeights.push(maxRowHeight);
        maxRowHeight = 0;
        col = 0;
      }
    }
    if (col > 0) rowHeights.push(maxRowHeight);
    // Calculate group width
    const groupWidth = maxColWidths.reduce((a, b) => a + b, 0) + (maxColWidths.length - 1) * NODE_DIMENSIONS.RESOURCE.MARGIN;
    if (groupWidth > maxWidth) maxWidth = groupWidth;
    // Calculate group height
    let groupHeight = rowHeights.reduce((a, b) => a + b, 0) + (rowHeights.length - 1) * NODE_DIMENSIONS.RESOURCE.MARGIN;
    totalHeight += 30 + 40 + groupHeight; // header + spacing + group height
  }
  totalHeight += padding;
  return {
    width: Math.max(getDefaultNodeWidth(nodeType), maxWidth + 2 * padding),
    height: Math.max(getDefaultNodeHeight(nodeType), totalHeight)
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

// Initialize ELK layout engine
const elk = new ELK();

/**
 * Calculate layout for nodes and edges
 */
export function calculateLayout(
  nodes: AWSNode[],
  edges: AWSEdge[]
): { nodes: AWSNode[]; edges: AWSEdge[] } {
  // First, apply hierarchical layout to get initial positions
  const { nodes: hierarchicalNodes } = applyHierarchicalLayout(nodes);
  
  // Apply ELK layout for more sophisticated positioning that respects parent-child relationships
  return applyElkLayoutSync(hierarchicalNodes, edges);
}

/**
 * Apply simple hierarchical layout
 */
function applyHierarchicalLayout(nodes: AWSNode[]): { nodes: AWSNode[] } {
  // Group nodes by type
  const typeGroups: Record<string, AWSNode[]> = {};
  
  nodes.forEach(node => {
    const type = node.data.type;
    if (!typeGroups[type]) {
      typeGroups[type] = [];
    }
    typeGroups[type].push(node);
  });
  
  // Layout variables
  const startX = 100;
  const startY = 100;
  const typeSpacingY = LAYOUT_CONFIG.levelSpacing;
  const nodeSpacingX = LAYOUT_CONFIG.nodeSpacing;
  
  // Order types for visual hierarchy
  const typeOrder = [
    'vpc', 'subnet', 'ec2', 'rds', 's3', 
    'security_group', 'route_table', 
    'internet_gateway', 'nat_gateway', 'network_acl',
    'load_balancer', 'lambda', 'dynamodb', 
    'sqs', 'sns', 'cloudwatch', 'api_gateway',
    'ecs', 'eks', 'elastic_beanstalk', 'kms',
    'iam_role', 'iam_user', 'iam_policy', 'generic'
  ];
  
  // Position nodes by type
  const positionedNodes = [...nodes];
  let currentY = startY;
  
  typeOrder.forEach(type => {
    const nodesOfType = typeGroups[type];
    if (nodesOfType && nodesOfType.length > 0) {
      const nodesPerRow = Math.min(5, nodesOfType.length);
      const rows = Math.ceil(nodesOfType.length / nodesPerRow);
      
      nodesOfType.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        
        const nodeIndex = positionedNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          positionedNodes[nodeIndex] = {
            ...node,
            position: {
              x: startX + (col * nodeSpacingX),
              y: currentY + (row * 150)
            }
          };
        }
      });
      
      currentY += (rows * 150) + typeSpacingY;
    }
  });
  
  return { nodes: positionedNodes };
}

/**
 * Apply ELK layout synchronously (using a prepared layout)
 */
function applyElkLayoutSync(
  nodes: AWSNode[],
  edges: AWSEdge[]
): { nodes: AWSNode[]; edges: AWSEdge[] } {
  try {
    // First, identify all parent nodes
    const parentNodeIds = new Set<string>();
    nodes.forEach(node => {
      if (node.parentNode) {
        parentNodeIds.add(node.parentNode);
      }
    });

    // --- NEW: Recursively update all container sizes before layout ---
    // Find all container nodes (VPCs, subnets, etc.)
    const containerTypes = [NODE_TYPES.VPC, NODE_TYPES.SUBNET];
    const containerNodeIds = nodes.filter(node => containerTypes.includes(node.data.type)).map(node => node.id);
    updateParentDimensions(nodes, containerNodeIds);
    // --- END NEW ---

    // For each parent node, position its children properly
    parentNodeIds.forEach(parentId => {
      const parentNode = nodes.find(node => node.id === parentId);
      if (!parentNode) return;
      
      const childNodes = nodes.filter(node => node.parentNode === parentId);
      if (childNodes.length === 0) return;
      
      // Layout children within parent
      childNodes.forEach((childNode, index) => {
        const position = positionChildNode(parentNode, index, childNodes.length, nodes);
        childNode.position = position;
      });
      
      // Update parent dimensions to fit children if needed
      const requiredWidth = Math.max(
        ...childNodes.map(child => 
          child.position.x + (child.style?.width as number || 200) + 40
        )
      );
      
      const requiredHeight = Math.max(
        ...childNodes.map(child => 
          child.position.y + (child.style?.height as number || 100) + 40
        )
      );
      
      // Ensure minimum dimensions
      const minimumWidth = parentNode.style?.width as number || 800;
      const minimumHeight = parentNode.style?.height as number || 400;
      
      // Update parent dimensions if needed
      parentNode.style = {
        ...parentNode.style,
        width: Math.max(minimumWidth, requiredWidth),
        height: Math.max(minimumHeight, requiredHeight)
      };
    });
    
    // Now position the parent nodes themselves using a simplified layout
    const parentNodes = nodes.filter(node => parentNodeIds.has(node.id));
    let y = 100;
    
    // Group parents by their type
    const groupedParents: Record<string, AWSNode[]> = {};
    
    parentNodes.forEach(node => {
      const type = node.data.type;
      if (!groupedParents[type]) {
        groupedParents[type] = [];
      }
      groupedParents[type].push(node);
    });
    
    // Position each group
    Object.values(groupedParents).forEach(parentGroup => {
      let x = 100;
      const spacing = 100;
      
      parentGroup.forEach(parent => {
        parent.position = { x, y };
        x += (parent.style?.width as number || 800) + spacing;
      });
      
      // Move down for next group
      y += (parentGroup[0]?.style?.height as number || 400) + 200;
    });
    
    return { nodes, edges };
  } catch (error) {
    console.error('Layout error:', error);
    return { nodes, edges };
  }
}

/**
 * Sync function for calculating layout
 * (Used when async ELK is not needed or available)
 */
export function calculateLayoutSync(
  nodes: AWSNode[],
  edges: AWSEdge[]
): { nodes: AWSNode[]; edges: AWSEdge[] } {
  const { nodes: hierarchicalNodes } = applyHierarchicalLayout(nodes);
  return { nodes: hierarchicalNodes, edges };
} 