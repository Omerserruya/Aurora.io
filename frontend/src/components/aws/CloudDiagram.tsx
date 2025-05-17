import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ConnectionMode,
  Connection,
  NodeMouseHandler,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';

// Import custom components and types
import { initialNodes } from './awsNodes';
import { initialEdges } from './awsEdges';
import { CloudDiagramProps } from './types';
import ResourceDetailsPanel from './components/ResourceDetailsPanel';
import DiagramControls from './components/DiagramControls';
import { convertAwsDataToFlow } from './utils/dataConverter';
import { calculateLayout } from './utils/layoutEngine';
import { NODE_TYPES } from './utils/constants';
import nodeTypes from './nodeRegistry';
import { AWSNode as AWSNodeType } from './awsNodes';
import { AWSEdge, AWSEdgeData } from './awsEdges';

const CloudDiagram: React.FC<CloudDiagramProps> = ({ awsData }) => {
  // Initialize with test data or converted AWS data
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<AWSNodeType | null>(null);

  const reactFlowInstance = useReactFlow();

  // Update nodes and edges when AWS data changes
  useEffect(() => {
    if (awsData) {
      const { nodes: convertedNodes, edges: convertedEdges } = convertAwsDataToFlow(awsData);
      
      if (convertedNodes.length > 0) {
        // Apply layout algorithm to ensure proper positioning
        const { nodes: layoutNodes, edges: layoutEdges } = calculateLayout(convertedNodes, convertedEdges);
        
        // Ensure VPC nodes are independent (not connected in parent-child relationship)
        const independentNodes = layoutNodes.map(node => {
          // Only modify VPC nodes to make them fully independent
          if (node.data.type === NODE_TYPES.VPC) {
            return {
              ...node,
              parentNode: undefined,
              extent: undefined,
              draggable: true, // Allow individual dragging
              connectable: false, // Prevent new connections
            };
          }
          return node;
        });
        
        // Set the nodes with calculated layout
        setNodes(independentNodes);
        setEdges(layoutEdges);
        
        // Fit view to show the entire diagram
        setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 200);
      }
    }
  }, [awsData, setNodes, setEdges, reactFlowInstance]);

  // Handle node selection
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node as AWSNodeType);
  }, []);

  // Handle edge connection
  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      setEdges((eds) => [
        ...eds,
        {
          id: `e-${params.source}-${params.target}`,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'smoothstep'
        } as Edge<AWSEdgeData>
      ]);
    }
  }, [setEdges]);

  // Center the view to fit the diagram
  const fitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  // Reset to the initial diagram
  const resetDiagram = useCallback(() => {
    if (awsData) {
      const { nodes: convertedNodes, edges: convertedEdges } = convertAwsDataToFlow(awsData);
      
      // Apply layout algorithm to ensure proper positioning
      const { nodes: layoutNodes, edges: layoutEdges } = calculateLayout(convertedNodes, convertedEdges);
      
      // Ensure VPC nodes are independent
      const independentNodes = layoutNodes.map(node => {
        if (node.data.type === NODE_TYPES.VPC) {
          return {
            ...node,
            parentNode: undefined,
            extent: undefined,
            draggable: true, // Allow individual dragging
            connectable: false, // Prevent new connections
          };
        }
        return node;
      });
      
      setNodes(independentNodes);
      setEdges(layoutEdges);
    } else {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
    setTimeout(() => fitView(), 200);
  }, [awsData, setNodes, setEdges, fitView]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
        {/* Main diagram area */}
        <Box sx={{ flexGrow: 1, height: '100%', border: '1px solid #ddd', borderRadius: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-right"
            minZoom={0.1}
            maxZoom={4}
            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
            nodesDraggable={true} // Enable dragging for nodes
            multiSelectionKeyCode={null} // Disable multi-selection
            selectionOnDrag={false} // Disable selection on drag
            panOnDrag={true} // Enable panning
            elementsSelectable={true} // Allow selecting elements
            zoomOnScroll={true} // Enable zoom on scroll
            zoomOnPinch={true} // Enable zoom on pinch
            panOnScroll={false} // Disable pan on scroll to prevent unexpected behavior
          >
            <Background />
            <Controls />
            <MiniMap />
            <DiagramControls resetDiagram={resetDiagram} fitView={fitView} />
          </ReactFlow>
        </Box>

        {/* Details sidebar */}
        {selectedNode && (
          <ResourceDetailsPanel 
            selectedNode={selectedNode} 
            onClose={() => setSelectedNode(null)}
            nodes={nodes}
          />
        )}
      </Box>
    </Box>
  );
};

// Wrap the component with ReactFlowProvider
const CloudDiagramWithProvider: React.FC<CloudDiagramProps> = ({ awsData }) => {
  return (
    <ReactFlowProvider>
      <Box sx={{ height: '100%', width: '100%' }}>
        <CloudDiagram awsData={awsData} />
      </Box>
    </ReactFlowProvider>
  );
};

export default CloudDiagramWithProvider; 