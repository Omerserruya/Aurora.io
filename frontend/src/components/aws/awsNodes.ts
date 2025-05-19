import { Node } from 'reactflow';
import { NODE_TYPES } from './constants';

interface GroupHeader {
  type: string;
  count: number;
}

/**
 * Data structure for AWS nodes
 */
export interface AWSNodeData {
  label: string;
  type: string;
  resourceId: string;
  faded?: boolean;
  groupHeaders?: GroupHeader[];
  [key: string]: any;
}

/**
 * Type alias for AWSNodeData to support existing imports
 */
export type AWSNodeDataTypes = AWSNodeData;

/**
 * AWS Node type for React Flow
 */
export type AWSNode = Node<AWSNodeData>;

/**
 * Initial nodes for empty diagram
 */
export const initialNodes: AWSNode[] = [
  {
    id: 'welcome-node',
    type: NODE_TYPES.GENERIC,
    position: { x: 100, y: 100 },
    data: {
      label: 'AWS Cloud Diagram',
      type: NODE_TYPES.GENERIC,
      resourceId: 'welcome',
      message: 'Select an AWS resource to view details'
    }
  }
]; 