"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import ReactFlow, { 
  type Node,
  type Edge,
  ReactFlowProvider,
  useReactFlow,
  Controls, 
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "reactflow"
import ELK from "elkjs/lib/elk.bundled.js"
import "reactflow/dist/style.css"
import { useReduxAccount } from "../hooks/useReduxAccount"
import React from "react"
import { Box, Typography, IconButton, Table, TableBody, TableCell, TableRow, Paper, Chip, Tooltip, CircularProgress, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import DnsIcon from '@mui/icons-material/Dns';
import RouterIcon from '@mui/icons-material/Router';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import PublicIcon from '@mui/icons-material/Public';
import LayersIcon from '@mui/icons-material/Layers';
import ComputerIcon from '@mui/icons-material/Computer';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';

// Import custom AWS nodes
import { nodeTypes } from '../components/aws/custom_nodes'

interface SimpleNode {
  id: string;
  type: string;
  label: string;
  parent?: string;
  properties?: Record<string, any>;
}

interface SimpleConnection {
  source: string;
  target: string;
}

interface SimpleInfrastructure {
  nodes: SimpleNode[];
  connections: SimpleConnection[];
}

// Node types
type NodeType = 'ec2' | 's3bucket' | 'alb' | 'internetgateway' | 'vpc' | 'subnet' | 'internet' | 'securitygroup';

// Default node dimensions
const DEFAULT_NODE_DIMENSIONS: Record<NodeType, { width: number; height: number }> = {
  ec2: { width: 100, height: 80 },
  s3bucket: { width: 100, height: 80 },
  alb: { width: 100, height: 80 },
  internetgateway: { width: 60, height: 60 },
  vpc: { width: 400, height: 300 }, // Default size for empty VPCs
  subnet: { width: 110, height: 60 },
  internet: { width: 110, height: 110 },
  securitygroup: { width: 100, height: 80 }
}

interface ELKNode {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  children?: ELKNode[];
  labels?: Array<{ text: string }>;
  layoutOptions?: Record<string, string>;
}

interface ELKEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ELKGraph {
  id: string;
  children: ELKNode[];
  edges: ELKEdge[];
  layoutOptions?: Record<string, string>;
}

// Helper function to calculate grid layout
const calculateGridLayout = (children: ELKNode[]): Record<string, string> => {
  if (!children || children.length === 0) return {};

  const count = children.length;
  let cols = Math.ceil(Math.sqrt(count));
  let rows = Math.ceil(count / cols);

  // Special handling for common subnet counts
  if (count === 6) {
    cols = 3;
    rows = 2;
  } else if (count === 8) {
    cols = 4;
    rows = 2;
  } else if (count === 9) {
    cols = 3;
    rows = 3;
  } else if (count === 12) {
    cols = 4;
    rows = 3;
  } else if (count === 16) {
    cols = 4;
    rows = 4;
  }

  return {
    'elk.algorithm': 'org.eclipse.elk.box',
    'elk.direction': 'RIGHT',
    'elk.aspectRatio': String(cols / rows),
    'elk.padding': '[top=20,left=20,bottom=20,right=20]',
    'elk.spacing.nodeNode': '40.0',
    'org.eclipse.elk.box.packingMode': 'GRID',
    'org.eclipse.elk.box.packingMode.grid': 'true',
    'org.eclipse.elk.box.packingMode.grid.columns': String(cols),
    'org.eclipse.elk.box.packingMode.grid.rows': String(rows)
  };
};

// Convert SimpleInfrastructure to ELK Graph
const convertSimpleToELK = (infrastructure: SimpleInfrastructure): ELKGraph => {
  const nodeMap = new Map<string, SimpleNode>()
  infrastructure.nodes.forEach(node => {
    if (node && node.id) {
      nodeMap.set(node.id, node)
    }
  })

  // Create a map of parent to children
  const childrenMap = new Map<string, SimpleNode[]>()
  infrastructure.nodes.forEach(node => {
    if (node && node.id && node.parent) {
      const children = childrenMap.get(node.parent) || []
      children.push(node)
      childrenMap.set(node.parent, children)
    }
  })

  // Add global internet node if it doesn't exist
  if (!infrastructure.nodes.some(node => node && node.type === 'internet')) {
    infrastructure.nodes.push({
      id: 'global-internet',
      type: 'internet',
      label: 'Internet'
    });
  }

  // Find all IGWs and connect them to internet
  const internetNode = infrastructure.nodes.find(node => node && node.type === 'internet');
  const igwNodes = infrastructure.nodes.filter(node => node && node.type === 'internetgateway');

  if (internetNode) {
    igwNodes.forEach(igw => {
      if (!infrastructure.connections.some(conn => 
        (conn.source === igw.id && conn.target === internetNode.id) ||
        (conn.target === igw.id && conn.source === internetNode.id)
      )) {
        infrastructure.connections.push({
          source: igw.id,
          target: internetNode.id
        });
      }
    });
  }

  // Recursively build the node hierarchy
  const buildNodeHierarchy = (node: SimpleNode): ELKNode => {
    if (!node || !node.id) {
      throw new Error('Invalid node: missing id');
    }

    const children = childrenMap.get(node.id) || []
    const nodeType = node.type as NodeType
    let dimensions = { ...DEFAULT_NODE_DIMENSIONS[nodeType] } // Clone default dimensions

    // Adjust VPC size based on content
    if (nodeType === 'vpc' && children.length > 0) {
      dimensions = {
        width: 800,
        height: 600
      }
    }

    // Calculate layout options based on number of children
    let layoutOptions: Record<string, string> | undefined = undefined;
    if (children.length > 0) {
      if (nodeType === 'vpc' && children.length === 6) {
        layoutOptions = {
          'elk.algorithm': 'org.eclipse.elk.box',
          'elk.direction': 'RIGHT',
          'elk.aspectRatio': String(3 / 2),
          'elk.padding': '[top=100,left=20,bottom=20,right=20]',
          'elk.spacing.nodeNode': '40.0',
          'org.eclipse.elk.box.packingMode': 'GRID',
          'org.eclipse.elk.box.packingMode.grid': 'true',
          'org.eclipse.elk.box.packingMode.grid.columns': '3',
          'org.eclipse.elk.box.packingMode.grid.rows': '2'
        };
      } else {
        layoutOptions = {
          ...calculateGridLayout(children),
          'elk.padding': '[top=60,left=20,bottom=20,right=20]',
        }
      }
    }

    return {
      id: node.id,
      width: dimensions.width,
      height: dimensions.height,
      labels: [{ text: node.label || node.id }],
      children: children.length > 0 ? children.map(buildNodeHierarchy) : undefined,
      layoutOptions
    }
  }

  // Get root nodes (nodes without parents)
  const rootNodes = infrastructure.nodes.filter(node => node && node.id && !node.parent)

  // Convert connections to ELK edges
  const edges: ELKEdge[] = infrastructure.connections
    .filter(conn => conn && conn.source && conn.target)
    .map((conn, index) => ({
      id: `edge-${index}`,
      sources: [conn.source],
      targets: [conn.target]
    }))

  return {
    id: 'root',
    children: rootNodes.map(buildNodeHierarchy),
    edges,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.padding': '[top=20,left=20,bottom=20,right=20]',
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.crossMin.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
    }
  }
}

// ELK Layout Hook
const useELKLayout = () => {
  const elk = useMemo(() => new ELK(), [])

  const layoutGraph = useCallback(
    async (graph: ELKGraph) => {
      try {
        const graphWithDimensions = applyDefaultDimensions(graph)
        const layoutedGraph = await elk.layout(graphWithDimensions as any)
        return layoutedGraph as unknown as ELKGraph
      } catch (error) {
        console.error("ELK layout error:", error)
        return graph
      }
    },
    [elk],
  )

  return { layoutGraph }
}

// Apply default dimensions to nodes
const applyDefaultDimensions = (graph: ELKGraph): ELKGraph => {
  const processNode = (node: ELKNode): ELKNode => {
    const nodeType = getNodeType(node.id)
    const defaultDimensions = DEFAULT_NODE_DIMENSIONS[nodeType as keyof typeof DEFAULT_NODE_DIMENSIONS]

    const processedNode = {
      ...node,
      width: node.width || defaultDimensions?.width || 100,
      height: node.height || defaultDimensions?.height || 80,
    }

    if (node.children && node.children.length > 0) {
      processedNode.children = node.children.map(processNode)
    }

    return processedNode
  }

  return {
    ...graph,
    children: graph.children.map(processNode),
    edges: graph.edges,
    id: graph.id,
    layoutOptions: graph.layoutOptions,
  }
}

// Helper function to determine node type
const getNodeType = (nodeId: string | undefined, nodeType?: string) => {
  if (!nodeId) return "ec2"; // Default to ec2 if no id provided
  
  // If nodeType is provided, use it directly
  if (nodeType) return nodeType;
  
  // Fallback to ID-based detection if no type provided
  if (nodeId === 'global-internet') return "internet"
  if (nodeId.startsWith("vpc")) return "vpc"
  if (nodeId.startsWith("subnet")) return "subnet"
  if (nodeId.startsWith("ec2")) return "ec2"
  if (nodeId.startsWith("s3") || nodeId.includes("bucket")) return "s3bucket"
  if (nodeId.startsWith("alb") || nodeId.includes("loadbalancer")) return "alb"
  if (nodeId.startsWith("igw") || nodeId.includes("internetgateway")) return "internetgateway"
  return "ec2" // default
}

// Convert ELK to React Flow
const convertELKToReactFlow = (elkGraph: ELKGraph) => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Helper function to calculate group bounds
  const calculateGroupBounds = (children: any[]) => {
    if (!children || children.length === 0) return { x: 0, y: 0, width: 200, height: 150 }

    const minX = Math.min(...children.map((child) => child.x || 0))
    const minY = Math.min(...children.map((child) => child.y || 0))
    const maxX = Math.max(...children.map((child) => (child.x || 0) + (child.width || 0)))
    const maxY = Math.max(...children.map((child) => (child.y || 0) + (child.height || 0)))

    const padding = 40
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding,
    }
  }

  // Helper to find the original node by id
  const findOriginalNode = (id: string): SimpleNode | undefined => {
    // Search in the original infrastructure data attached to the ELK graph
    // @ts-ignore
    return elkGraph._originalSimpleNodes?.find((n: SimpleNode) => n.id === id)
  }

  // Process nodes recursively
  const processNode = (node: any, parentId?: string, level = 0) => {
    if (!node || !node.id) return; // Skip if node or node.id is undefined

    const isGroup = node.children && node.children.length > 0
    const label = node.labels?.[0]?.text || node.id
    const nodeType = getNodeType(node.id, node.type)
    const originalNode = findOriginalNode(node.id)

    if (isGroup) {
      // Process children first
      node.children.forEach((child: any) => processNode(child, node.id, level + 1))

      // For group nodes, use ELK's calculated dimensions or calculate bounds
      const bounds =
        node.width && node.height
          ? { x: node.x || 0, y: node.y || 0, width: node.width, height: node.height }
          : calculateGroupBounds(node.children)

      nodes.push({
        id: node.id,
        type: nodeType,
        position: { x: bounds.x, y: bounds.y },
        data: {
          label,
          width: bounds.width,
          height: bounds.height,
          id: node.id,
          properties: originalNode?.properties || null
        },
        style: {
          width: bounds.width,
          height: bounds.height,
          zIndex: level,
        },
        parentNode: parentId,
        extent: parentId ? "parent" : undefined,
        draggable: true,
        selectable: true,
      })
    } else {
      // Leaf node
      const nodeWidth = node.width || DEFAULT_NODE_DIMENSIONS[nodeType as keyof typeof DEFAULT_NODE_DIMENSIONS]?.width || 100
      const nodeHeight = node.height || DEFAULT_NODE_DIMENSIONS[nodeType as keyof typeof DEFAULT_NODE_DIMENSIONS]?.height || 80

      nodes.push({
        id: node.id,
        type: nodeType,
        position: { x: node.x || 0, y: node.y || 0 },
        data: { 
          label,
          id: node.id,
          properties: originalNode?.properties || null
        },
        style: {
          width: nodeWidth,
          height: nodeHeight,
          zIndex: level + 10, // Ensure leaf nodes are above groups
        },
        parentNode: parentId,
        extent: parentId ? "parent" : undefined,
        draggable: true,
        selectable: true,
      })
    }
  }

  // Process all root children
  elkGraph.children.forEach((child) => processNode(child))

  // Convert edges with different colors based on type
  elkGraph.edges.forEach((elkEdge, index) => {
    elkEdge.sources.forEach((source) => {
      elkEdge.targets.forEach((target) => {
        // Determine edge color based on connection type
        let edgeColor = "#6b7280"
        if (source.startsWith("igw") || target.startsWith("igw")) {
          edgeColor = "#8C4FFF"
        } else if (source.startsWith("alb") || target.startsWith("alb")) {
          edgeColor = "#9c27b0"
        } else if (source.startsWith("s3") || target.startsWith("s3")) {
          edgeColor = "#1B660F"
        } else if (source.startsWith("vpc") && target.startsWith("vpc")) {
          edgeColor = "#1976d2"
        }

        edges.push({
          id: `${elkEdge.id}-${source}-${target}-${index}`,
          source,
          target,
          type: "smoothstep",
          animated: false,
          style: { stroke: edgeColor, strokeWidth: 2 },
        })
      })
    })
  })

  return { nodes, edges }
}

// Config mapping for which fields to show per resource type
const RESOURCE_FIELDS: Record<string, string[]> = {
  ec2: ["InstanceId", "InstanceType", "VpcId", "SubnetId", "ImageId", "ImageName", "ImageDescription", "ImageCreationDate"],
  vpc: ["VpcId", "CidrBlock"],
  subnet: ["SubnetId", "VpcId", "CidrBlock"],
  security_group: ["GroupId", "GroupName", "VpcId", "Description", "InboundRules", "OutboundRules"],
  s3: ["Name", "CreationDate"],
  s3bucket: ["Name", "CreationDate"], // alias for s3bucket
  route_table: ["RouteTableId", "VpcId", "Routes", "Associations"],
  internet_gateway: ["InternetGatewayId", "Attachments"],
  nat_gateway: ["NatGatewayId", "SubnetId", "VpcId"],
  network_acl: ["NetworkAclId", "VpcId", "Entries"],
  elastic_ip: ["PublicIp", "AllocationId", "InstanceId", "NetworkInterfaceId"],
  transit_gateway: ["TransitGatewayId", "State", "Options"],
  load_balancer: ["LoadBalancerArn", "LoadBalancerName", "VpcId", "Type", "Scheme"],
  alb: ["LoadBalancerArn", "LoadBalancerName", "VpcId", "Type", "Scheme"], // alias for alb
  ecs_cluster: ["ClusterArn", "ClusterName", "Status"],
  ecs_task: ["TaskArn", "ClusterArn", "TaskDefinitionArn", "LastStatus"],
  lambda_function: ["FunctionName", "FunctionArn", "Runtime", "VpcConfig"],
  iam_role: ["RoleName", "RoleId", "AssumeRolePolicyDocument"],
  iam_user: ["UserName", "UserId", "CreateDate"],
  iam_policy: ["PolicyName", "PolicyId", "AttachmentCount"]
};

const HEADER_HEIGHT = 64; // Adjust if your header is a different height

const TYPE_ICON_COLOR: Record<string, { icon: React.ReactNode, color: 'primary' | 'secondary' | 'default' | 'success' | 'error' | 'info' | 'warning' }> = {
  ec2: { icon: <ComputerIcon />, color: 'primary' },
  vpc: { icon: <CloudIcon />, color: 'info' },
  subnet: { icon: <DnsIcon />, color: 'success' },
  s3: { icon: <StorageIcon />, color: 'warning' },
  s3bucket: { icon: <StorageIcon />, color: 'warning' },
  internetgateway: { icon: <RouterIcon />, color: 'secondary' },
  alb: { icon: <DeviceHubIcon />, color: 'secondary' },
  load_balancer: { icon: <DeviceHubIcon />, color: 'secondary' },
  internet: { icon: <PublicIcon />, color: 'default' },
  // ...add more as needed
};

// Material UI-based side panel for node details
const NodeDetailsPanel = ({ node, onClose }: { node: Node | null, onClose: () => void }) => {
  if (!node) return null;
  const properties = node.data?.properties;
  const nodeType = typeof node.type === 'string' ? node.type : '';
  const typeKey = nodeType in RESOURCE_FIELDS ? nodeType : (nodeType === 's3bucket' ? 's3bucket' : nodeType);
  const fields: string[] = RESOURCE_FIELDS[typeKey] || [];
  const typeInfo = TYPE_ICON_COLOR[typeKey] || { icon: <LayersIcon />, color: 'default' };

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 380,
        height: '100%',
        zIndex: 2000,
        p: 3,
        overflowY: 'auto',
        borderRadius: 0,
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {node.data?.label || node.id}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Chip
        icon={typeInfo.icon as React.ReactElement}
        label={nodeType || "Resource"}
        color={typeInfo.color}
        sx={{ mb: 2, fontWeight: 600, fontSize: 15 }}
      />
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        ID: {node.id}
      </Typography>
      {fields.length > 0 && properties ? (
        <Table size="small" sx={{ mt: 2 }}>
          <TableBody>
            {fields.map((field: string) =>
              properties[field] !== undefined ? (
                <TableRow key={field}>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>{field}</TableCell>
                  <TableCell>
                    {typeof properties[field] === 'object'
                      ? <pre style={{ margin: 0, background: '#f6f8fa', borderRadius: 3, padding: 4, fontSize: 12 }}>{JSON.stringify(properties[field], null, 2)}</pre>
                      : String(properties[field])}
                  </TableCell>
                </TableRow>
              ) : null
            )}
          </TableBody>
        </Table>
      ) : (
        <Typography color="text.disabled" sx={{ mt: 2 }}>
          No additional resource details available.
        </Typography>
      )}
    </Paper>
  );
}

// Main Graph Component
const InfrastructureGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const { layoutGraph } = useELKLayout()
  const { fitView } = useReactFlow()
  const { account } = useReduxAccount();

  // Function to handle fit view with consistent settings
  const handleFitView = useCallback(() => {
    if (!isInitialized) return;
    fitView({ 
      duration: 0,
      includeHiddenNodes: false,
      maxZoom: 2.0,
      minZoom: 0.3
    });
  }, [fitView, isInitialized]);

  // SOFT REFRESH: Fetch data from backend
  const fetchData = useCallback(async () => {
    if (!account?._id) return;
    try {
      setIsLoading(true);
      setSyncStatus(null);
      const response = await fetch(`/api/db/neo/visualization/${account._id}`);
      const infrastructureData: SimpleInfrastructure = await response.json();
      const elkGraph = convertSimpleToELK(infrastructureData);
      // Attach the original backend nodes for property lookup
      // @ts-ignore
      elkGraph._originalSimpleNodes = infrastructureData.nodes;
      const layoutedGraph = await layoutGraph(elkGraph);
      const { nodes: newNodes, edges: newEdges } = convertELKToReactFlow(layoutedGraph);
      setNodes(newNodes);
      setEdges(newEdges);
      setIsInitialized(true);
    } catch (error) {
      setSyncStatus('Failed to fetch infrastructure data');
      console.error("Error fetching and processing graph:", error);
    } finally {
      setIsLoading(false);
    }
  }, [layoutGraph, setNodes, setEdges, account?._id]);

  // HARD REFRESH: Call cloud query API and poll for new data
  const handleSync = useCallback(async () => {
    if (!account?._id) return;
    setIsSyncing(true);
    setSyncStatus('Syncing with AWS...');
    try {
      // 1. Trigger the cloud query (sync) on the backend
      const triggerRes = await fetch(`/api/cloud/query/${account._id}`, { method: 'POST' });
      if (!triggerRes.ok) throw new Error('Failed to trigger cloud query');
      setSyncStatus('Cloud query started. Waiting for AWS data...');

      // 2. Poll for new data
      let pollingAttempts = 0;
      const maxPollingAttempts = 12; // e.g., poll for up to 1 minute
      const pollInterval = 5000; // 5 seconds
      let newData: SimpleInfrastructure | null = null;
      while (pollingAttempts < maxPollingAttempts) {
        await new Promise(res => setTimeout(res, pollInterval));
        pollingAttempts++;
        setSyncStatus(`Syncing with AWS... (attempt ${pollingAttempts}/${maxPollingAttempts})`);
        const pollRes = await fetch(`/api/db/neo/visualization/${account._id}`);
        if (pollRes.ok) {
          const polledData: SimpleInfrastructure = await pollRes.json();
          if (polledData && polledData.nodes && polledData.nodes.length > 0) {
            newData = polledData;
            break;
          }
        }
      }
      if (newData) {
        // 3. Update the visualization with the new data
        const elkGraph = convertSimpleToELK(newData);
        // Attach the original backend nodes for property lookup
        // @ts-ignore
        elkGraph._originalSimpleNodes = newData.nodes;
        const layoutedGraph = await layoutGraph(elkGraph);
        const { nodes: newNodes, edges: newEdges } = convertELKToReactFlow(layoutedGraph);
        setNodes(newNodes);
        setEdges(newEdges);
        setIsInitialized(true);
        setSyncStatus('Data successfully synchronized');
      } else {
        setSyncStatus('Cloud query still in progress or timed out. Please try again later.');
      }
    } catch (error) {
      setSyncStatus('Failed to sync with AWS');
    } finally {
      setIsSyncing(false);
    }
  }, [account?._id, layoutGraph]);

  // Listen for account changes
  useEffect(() => {
    if (account?._id) {
      fetchData();
    } else {
      setNodes([]);
      setEdges([]);
      setIsInitialized(false);
    }
  }, [account?._id, fetchData, setNodes, setEdges]);

  // Handle window resize with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleFitView();
      }, 250);
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId);
    }
  }, [handleFitView])

  // Node click handler
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // Show a message if no account is selected
  if (!account?._id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Account Selected</h2>
          <p className="text-gray-600">Please select an AWS account to view its infrastructure.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading infrastructure data...</div>
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        flex: 1,
        position: 'relative'
      }}>
        {/* Soft/Hard Refresh Buttons */}
        <Box sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 3000,
          display: 'flex',
          gap: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          padding: 0.5,
          boxShadow: 2
        }}>
          <Tooltip title="Soft Refresh (reload data)">
            <span>
              <IconButton
                onClick={fetchData}
                size="small"
                disabled={isLoading || isSyncing}
                sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' } }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Hard Refresh (sync with AWS)">
            <span>
              <IconButton
                onClick={handleSync}
                size="small"
                color="primary"
                disabled={isSyncing}
                sx={{ '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' } }}
              >
                <SyncIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          nodesDraggable={true}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ 
            includeHiddenNodes: false,
            maxZoom: 2.0,
            minZoom: 0.3,
            duration: 0
          }}
          minZoom={0.3}
          maxZoom={2.0}
          onInit={handleFitView}
          onNodeClick={(event, node) => setSelectedNode(node)}
          style={{ width: '100%', height: '100%' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls 
            showInteractive={false}
            fitViewOptions={{ 
              maxZoom: 2.0,
              minZoom: 0.3
            }}
          />
        </ReactFlow>
        <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>
      {/* Global bottom-right banner for hard refresh/sync progress */}
      <Snackbar
        open={isSyncing}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ zIndex: 4000 }}
      >
        <Alert
          icon={<CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />}
          severity="info"
          variant="filled"
          sx={{ minWidth: 320, fontWeight: 500, fontSize: 16, alignItems: 'center' }}
        >
          {syncStatus || 'Syncing with AWS...'}
        </Alert>
      </Snackbar>
    </div>
  )
}

// Main Component with Provider
export default function Visualization() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <InfrastructureGraph />
      </ReactFlowProvider>
    </div>
  )
} 