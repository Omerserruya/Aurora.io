import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import ReactFlow, { 
  Controls, 
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  ConnectionMode,
  MarkerType,
  EdgeTypes,
  getBezierPath,
  EdgeProps,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '../components/aws/custom_nodes';
import { CustomNodeData } from '../components/aws/custom_nodes';

// Custom step edge with curved corners
const CustomStepEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  // Calculate the middle point for the step
  const midY = sourceY + (targetY - sourceY) * 0.5;
  
  // Create a path with smooth corners
  const path = `
    M ${sourceX},${sourceY}
    C ${sourceX},${sourceY + 50} ${sourceX},${midY - 50} ${sourceX},${midY}
    L ${targetX},${midY}
    C ${targetX},${midY + 50} ${targetX},${targetY - 50} ${targetX},${targetY}
  `;

  return (
    <path
      style={style}
      className="react-flow__edge-path"
      d={path}
      markerEnd={markerEnd}
    />
  );
};

const edgeTypes: EdgeTypes = {
  custom: CustomStepEdge,
};

const initialEdges: Edge[] = [
  {
    id: 'internet-igw',
    source: '10',
    target: '7',
    type: 'custom',
    animated: true,
    style: { 
      stroke: 'url(#edge-gradient)',
      strokeWidth: 2
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#8C4FFF'
    }
  },
  {
    id: 'igw-alb',
    source: '7',
    target: '6',
    type: 'custom',
    animated: true,
    style: { 
      stroke: 'url(#edge-gradient)',
      strokeWidth: 2
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#8C4FFF'
    }
  },
  {
    id: 'alb-webserver',
    source: '6',
    target: '4',
    type: 'custom',
    animated: true,
    style: { 
      stroke: 'url(#edge-gradient)',
      strokeWidth: 2
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#8C4FFF'
    }
  },
  {
    id: 'alb-database',
    source: '6',
    target: '9',
    type: 'custom',
    animated: true,
    style: { 
      stroke: 'url(#edge-gradient)',
      strokeWidth: 2
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#8C4FFF'
    }
  },
  {
    id: 'ec2-s3',
    source: '5',
    target: '8',
    type: 'custom',
    animated: true,
    style: { 
      stroke: 'url(#edge-gradient)',
      strokeWidth: 2
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#8C4FFF'
    }
  }
];

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: '1',
    type: 'vpc',
    position: { x: 50, y: 50 },
    data: { label: 'Main VPC' },
    style: { 
      zIndex: 0,
      width: 800,
      height: 400
    }
  },
  {
    id: '2',
    type: 'subnet',
    position: { x: 40, y: 60 },
    data: { label: 'Public Subnet' },
    parentNode: '1',
    extent: 'parent',
    draggable: true,
    style: { 
      zIndex: 1,
      width: 300,
      height: 300
    }
  },
  {
    id: '3',
    type: 'subnet',
    position: { x: 460, y: 60 },
    data: { label: 'Private Subnet' },
    parentNode: '1',
    extent: 'parent',
    draggable: true,
    style: { 
      zIndex: 1,
      width: 300,
      height: 200
    }
  },
  {
    id: '4',
    type: 'ec2',
    position: { x: 180, y: 80 },
    data: { label: 'Web Server' },
    parentNode: '2',
    extent: 'parent',
    draggable: true,
    style: { 
      zIndex: 2,
    }
  },
  {
    id: '5',
    type: 'ec2',
    position: { x: 75, y: 80 },
    data: { label: 'Database' },
    parentNode: '3',
    extent: 'parent',
    draggable: true,
    style: { 
      zIndex: 2,
      width: 150
    }
  },{
    id: '9',
    type: 'ec2',
    position: { x: 10, y: 80 },
    data: { label: 'Database' },
    parentNode: '2',
    extent: 'parent',
    draggable: true,
    style: { 
      zIndex: 2,
      width: 150
    }
  },
  {
    id: '6',
    type: 'loadbalancer',
    position: { x: 90, y: 200 },
    data: { label: 'Application LB' },
    parentNode: '2',
    extent: 'parent',
    draggable: true,
    style: { 
      zIndex: 2
    }
  },
  {
    id: '7',
    type: 'internetgateway',
    position: { x: 360, y: -20 },
    data: { label: 'Internet Gateway' },
    parentNode: '1',
    extent: 'parent',
    draggable: true,
    style: {
      zIndex: 2
    }
  },
  {
    id: '8',
    type: 's3bucket',
    position: { x: 460, y: 500   },
    data: { label: 'Assets Bucket' },
    draggable: true,
    style: {
      zIndex: 2
    }
  },
  {
    id: '10',
    type: 'internet',
    position: { x: 380, y: -120 },
    data: { label: 'Internet' },
    draggable: true,
    style: {
      zIndex: 2
    }
  }
];

const edgeOptions = {
  type: 'custom',
  animated: true,
  style: {
    stroke: 'url(#edge-gradient)',
    strokeWidth: 2,
  }
};

function Visualization() {
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  return (
    <Box 
      sx={{ 
        height: '100%',
        width: '100%', 
        position: 'absolute',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="edge-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00C9FF" />
            <stop offset="100%" stopColor="#8C4FFF" />
          </linearGradient>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={edgeOptions}
        elevateEdgesOnSelect={true}
        elevateNodesOnSelect={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </Box>
  );
}

export default Visualization; 