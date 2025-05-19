import { Edge } from 'reactflow';
import { RelationshipType } from './types';

/**
 * Edge data for AWS resource relationships
 */
export interface AWSEdgeData {
  type: RelationshipType;
  description?: string;
  source?: string;
  target?: string;
  [key: string]: any;
}

/**
 * AWS Edge type for React Flow
 */
export type AWSEdge = Edge<AWSEdgeData>;

/**
 * Initial edges for empty diagram
 */
export const initialEdges: AWSEdge[] = [];

/**
 * Re-export RelationshipType for convenience
 */
export { RelationshipType }; 