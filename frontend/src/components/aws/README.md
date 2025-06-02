# AWS Cloud Diagram

This module provides an interactive visualization of AWS cloud architecture using React Flow.

## Overview

The AWS Cloud Diagram component renders a visual representation of AWS resources and their relationships. It supports dark/light theme, custom SVG icons, resource-type specific colors, interactivity features and more.

## Components

- `CloudDiagram.tsx`: The main React Flow component that renders the AWS resources diagram
- `nodeRegistry.ts`: Registry of custom node types with their styling and rendering logic
- `constants.ts`: Shared constants including node types, colors, and configuration
- `types.ts`: TypeScript interfaces and types for the module

## Data Processing

The visualization consumes a standardized AWS architecture data format with resources at the root level:

```json
{
  "vpcs": [...],
  "s3Buckets": [...],
  "iamRoles": [...],
  /* Other top-level resources */
}
```

### Internal Data Flow

1. Raw AWS data → Data Converter → React Flow format
2. Processors for each resource type handle specific transformations
3. Layout Engine automatically positions nodes to avoid overlap
4. Node/Edge factories create themed, consistent UI elements

## Adding New Resource Types

To add support for a new AWS resource type:

1. Update `types.ts` with the new resource interface
2. Create a custom node component in `components/` if needed
3. Add the resource color scheme in `constants.ts`
4. Register the node type in `nodeRegistry.ts`
5. Update the data converter to process the new resource type
6. Add any necessary relationship processors

## Theme Support

The visualization supports both light and dark themes through the ThemeContext. Each node type has specific color schemes for both modes.

## Architecture Improvements

The refactored architecture:

1. Moved from a nested hierarchy to a flat resource structure
2. Uses ELK layout engine for optimal node positioning
3. Consolidated resource-specific logic into dedicated processors
4. Improved type safety and documentation
5. Supports all AWS resource types from the backend

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