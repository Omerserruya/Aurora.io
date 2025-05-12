# AWS Architecture Visualization Components

This directory contains components and utilities for visualizing AWS architecture using ReactFlow.

## File Structure

```
aws/
├── components/                  # UI components
│   ├── DiagramControls.tsx      # Controls for the diagram (reset, fit view)
│   └── ResourceDetailsPanel.tsx # Panel showing details of selected resources
├── utils/                       # Utility functions
│   ├── dataConverter.ts         # Converts AWS data to ReactFlow nodes/edges
│   ├── resourceUtils.ts         # Utilities for resource icons, colors, names
│   └── transformUtils.ts        # Shared transformation helpers
├── AWSNode.tsx                  # Custom node renderer for AWS resources
├── awsEdges.ts                  # Edge definitions and types
├── awsNodes.ts                  # Node definitions and types
├── CloudDiagram.tsx             # Main diagram component
├── nodeRegistry.ts              # Registry of node types
└── types.ts                     # Shared TypeScript types
```

## Component Responsibilities

### CloudDiagram.tsx
The main component that orchestrates the AWS architecture visualization. It:
- Sets up the ReactFlow canvas
- Manages state for nodes, edges and selection
- Handles events (selection, connection)
- Composes other components

### AWSNode.tsx
Custom node renderer that displays AWS resources with proper styling and icons.

### ResourceDetailsPanel
Displays detailed information about a selected AWS resource.

### DiagramControls
Provides UI controls for manipulating the diagram (reset, fit view).

## Utilities

### dataConverter.ts
Handles the conversion of AWS architecture data to ReactFlow nodes and edges.
Each AWS resource type has its own processor function:
- `processSubnets()`
- `processInternetGateways()`
- `processRouteTables()`
- ...etc.

### resourceUtils.ts
Provides utilities for working with resource visuals:
- `getResourceIcon()` - Returns the icon for a resource type
- `getResourceColors()` - Returns color scheme for a resource type
- `getResourceTypeName()` - Returns friendly name for a resource type

### transformUtils.ts
Shared utilities for transforming data:
- `createResourceRelationship()` - Create edges between nodes
- `findResourcesByProperty()` - Find nodes by property
- `createSectionHeader()` - Create section header nodes
- `initializeSectionBottoms()` - Initialize position tracking

## Types

### types.ts
Defines shared TypeScript interfaces and types used across components:
- `CloudDiagramProps` - Props for CloudDiagram component
- `SectionBottoms` - Tracking vertical positions during layout
- `RelationshipType` - Edge relationship types
- `ResourceColorScheme` - Color schemes for resources
- `ConversionResult` - Result of data conversion

## How to Extend

### Adding New Resource Types
1. Add the new resource type to `nodeRegistry.ts`
2. Update the relevant type definitions in `types.ts`
3. Add icon mapping in `resourceUtils.ts`
4. Add color scheme in `resourceUtils.ts`
5. Add type name in `resourceUtils.ts`
6. Create a processor function in `dataConverter.ts`

### Customizing Visualization
- Modify `AWSNode.tsx` to change how nodes look
- Update edge styles in `awsEdges.ts`
- Modify layout calculations in resource processors

## Implementation Notes

The `dataConverter.ts` file contains function stubs for all resource types, but only `processSubnets()` is fully implemented. When implementing the remaining functions, follow the pattern established in `processSubnets()`:

1. Check if the resource exists
2. Create a section header
3. Loop through resources and create nodes
4. Create edges between nodes
5. Update `sectionBottoms` for proper vertical positioning

## Usage Example

```tsx
import CloudDiagramWithProvider from './aws/CloudDiagram';
import { AWSArchitecture } from './aws-architecture-visualizer';

const MyComponent = ({ awsData }) => {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <CloudDiagramWithProvider awsData={awsData} />
    </div>
  );
};
``` 