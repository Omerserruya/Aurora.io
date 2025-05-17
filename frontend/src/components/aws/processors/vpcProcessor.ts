import { AWSNode as AWSNodeType } from '../awsNodes';
import { AWSEdge } from '../awsEdges';
import { ConversionResult } from '../types';
import { createVpcNode, createResourceNode } from '../utils/nodeFactory';
import { 
  ResourceProcessor, 
  getResourceId,
  updateContainerDimensions,
  positionNodeInParent
} from './baseProcessor';
import SubnetProcessor from './subnetProcessor';
import InternetGatewayProcessor from './internetGatewayProcessor';
import SecurityGroupProcessor from './securityGroupProcessor';

/**
 * Processor for AWS VPC resources
 */
export default class VpcProcessor implements ResourceProcessor {
  private subnetProcessor: SubnetProcessor;
  private internetGatewayProcessor: InternetGatewayProcessor;
  private securityGroupProcessor: SecurityGroupProcessor;
  
  constructor() {
    this.subnetProcessor = new SubnetProcessor();
    this.internetGatewayProcessor = new InternetGatewayProcessor();
    this.securityGroupProcessor = new SecurityGroupProcessor();
  }
  
  /**
   * Process VPC resources
   */
  process(
    vpcs: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void {
    if (!vpcs || vpcs.length === 0) return;
    
    const { nodes, edges } = result;
    
    // Process each VPC
    vpcs.forEach((vpc, vpcIndex) => {
      // Create VPC node ID
      const vpcId = getResourceId('vpc', vpc.vpcId, generateNodeId);
      
      // Create VPC node with default position (0,0) - will be positioned by layoutEngine
      const vpcNode = createVpcNode(
        vpcId,
        vpc.name || `VPC ${vpc.vpcId || vpcIndex + 1}`,
        vpc.vpcId || '',
        vpc.cidrBlock || '',
        0,  // X position - to be set by layout engine
        0   // Y position - to be set by layout engine
      );
      
      // Add VPC node to results
      nodes.push(vpcNode);
      
      // Process subnets within this VPC
      if (vpc.subnets && vpc.subnets.length > 0) {
        this.subnetProcessor.process(
          vpc.subnets,
          result,
          generateNodeId,
          generateEdgeId,
          vpcId
        );
      }
      
      // Process internet gateways if any
      if (vpc.internetGateways && vpc.internetGateways.length > 0) {
        this.internetGatewayProcessor.process(
          vpc.internetGateways, 
          result, 
          generateNodeId, 
          generateEdgeId,
          vpcId
        );
      }
      
      // Process NAT gateways if any
      if (vpc.natGateways && vpc.natGateways.length > 0) {
        this.processNatGateways(
          vpc.natGateways, 
          vpcId, 
          result, 
          generateNodeId, 
          generateEdgeId
        );
      }
      
      // Process security groups if any
      if (vpc.securityGroups && vpc.securityGroups.length > 0) {
        this.securityGroupProcessor.process(
          vpc.securityGroups,
          result,
          generateNodeId,
          generateEdgeId,
          vpcId
        );
      }
    });
    
    // Update VPC dimensions after all children are added
    const vpcIds = nodes
      .filter(node => node.type === 'vpc')
      .map(node => node.id);
      
    updateContainerDimensions(nodes, vpcIds);
  }
  
  /**
   * Process NAT Gateways
   */
  private processNatGateways(
    gateways: any[],
    vpcId: string,
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void {
    const { nodes, edges } = result;
    
    // Process each NAT Gateway
    gateways.forEach((gateway, index) => {
      // Create NAT Gateway node ID
      const natGwId = getResourceId('natgw', gateway.natGatewayId, generateNodeId);
      
      // Create NAT Gateway node using the factory function
      const natGwNode = createResourceNode(
        natGwId,
        gateway.name || `NAT Gateway ${index + 1}`,
        'nat_gateway',
        natGwId,
        vpcId, // Parent node
        0, 0, // Position will be updated by positionNodeInParent
        {
          NatGatewayId: gateway.natGatewayId || '',
          VpcId: vpcId,
          SubnetId: gateway.subnetId || '',
          AllocationId: gateway.allocationId || ''
        }
      );
      
      // Add NAT Gateway node to results
      nodes.push(natGwNode);
      
      // Position NAT Gateway relative to its parent
      positionNodeInParent(natGwNode, nodes, vpcId);
      
      // Create edge from NAT Gateway to VPC
      edges.push({
        id: generateEdgeId(),
        source: natGwId,
        target: vpcId,
        type: 'smoothstep',
        data: {
          type: 'natgw-to-vpc',
          description: 'NAT Gateway is in VPC'
        }
      });
    });
  }
} 