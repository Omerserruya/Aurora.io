import { AWSNode } from '../awsNodes';
import { AWSEdge } from '../awsEdges';
import { ConversionResult, RelationshipType } from '../types';
import { createVpcNode, createResourceNode } from '../utils/nodeFactory';
import { 
  ResourceProcessor, 
  getResourceId,
  updateContainerDimensions,
  positionNodeInParent,
  createResourceRelationship,
  createGlobalResourcesContainer,
  createGroupHeaders
} from './baseProcessor';
import SubnetProcessor from './subnetProcessor';
import InternetGatewayProcessor from './internetGatewayProcessor';
import SecurityGroupProcessor from './securityGroupProcessor';
import { NODE_TYPES } from '../constants';

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
      
      // Create VPC node
      const vpcNode: AWSNode = {
        id: vpcId,
        type: NODE_TYPES.VPC,
        position: { x: 0, y: 0 }, // Will be positioned by layout engine
        data: {
          label: vpc.vpcId || 'VPC',
          type: NODE_TYPES.VPC,
          resourceId: vpcId,
          VpcId: vpc.vpcId || '',
          CidrBlock: vpc.cidrBlock || '',
          IsDefault: vpc.isDefault || false
        },
        style: {
          width: 1200,
          height: 1000
        }
      };
      
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
      
      // Process route tables if any
      if (vpc.routeTables && vpc.routeTables.length > 0) {
        this.processRouteTables(
          vpc.routeTables,
          vpcId,
          result,
          generateNodeId,
          generateEdgeId
        );
      }
      
      // Process network ACLs if any
      if (vpc.networkAcls && vpc.networkAcls.length > 0) {
        this.processNetworkAcls(
          vpc.networkAcls,
          vpcId,
          result,
          generateNodeId,
          generateEdgeId
        );
      }
      
      // Process load balancers if any
      if (vpc.loadBalancers && vpc.loadBalancers.length > 0) {
        this.processLoadBalancers(
          vpc.loadBalancers,
          vpcId,
          result,
          generateNodeId,
          generateEdgeId
        );
      }
      
      // Create group headers for all resource types
      createGroupHeaders(result, generateNodeId, vpcId, nodes);
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
          type: RelationshipType.NATGW_TO_VPC,
          description: 'NAT Gateway is in VPC'
        }
      });
    });
  }
  
  /**
   * Process Route Tables
   */
  private processRouteTables(
    routeTables: any[],
    vpcId: string,
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void {
    const { nodes, edges } = result;
    
    // Process each Route Table
    routeTables.forEach((routeTable, index) => {
      // Create Route Table node ID
      const rtId = getResourceId('rt', routeTable.routeTableId, generateNodeId);
      
      // Create Route Table node
      const rtNode = createResourceNode(
        rtId,
        routeTable.name || `Route Table ${index + 1}`,
        'route_table',
        rtId,
        vpcId,
        0, 0, // Position will be updated by positionNodeInParent
        {
          RouteTableId: routeTable.routeTableId || '',
          VpcId: vpcId,
          Routes: routeTable.routes || []
        }
      );
      
      // Add Route Table node to results
      nodes.push(rtNode);
      
      // Position Route Table relative to VPC
      positionNodeInParent(rtNode, nodes, vpcId);
      
      // Create edge from Route Table to VPC
      edges.push({
        id: generateEdgeId(),
        source: rtId,
        target: vpcId,
        type: 'smoothstep',
        data: {
          type: RelationshipType.NATGW_TO_VPC,
          description: 'Route Table is in VPC'
        }
      });
    });
  }
  
  /**
   * Process Network ACLs
   */
  private processNetworkAcls(
    networkAcls: any[],
    vpcId: string,
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void {
    const { nodes, edges } = result;
    
    // Process each Network ACL
    networkAcls.forEach((nacl, index) => {
      // Create Network ACL node ID
      const naclId = getResourceId('nacl', nacl.networkAclId, generateNodeId);
      
      // Create Network ACL node
      const naclNode = createResourceNode(
        naclId,
        nacl.name || `Network ACL ${index + 1}`,
        'network_acl',
        naclId,
        vpcId,
        0, 0, // Position will be updated by positionNodeInParent
        {
          NetworkAclId: nacl.networkAclId || '',
          VpcId: vpcId,
          Entries: nacl.entries || []
        }
      );
      
      // Add Network ACL node to results
      nodes.push(naclNode);
      
      // Position Network ACL relative to VPC
      positionNodeInParent(naclNode, nodes, vpcId);
      
      // Create edge from Network ACL to VPC
      edges.push({
        id: generateEdgeId(),
        source: naclId,
        target: vpcId,
        type: 'smoothstep',
        data: {
          type: RelationshipType.NATGW_TO_VPC,
          description: 'Network ACL is in VPC'
        }
      });
    });
  }
  
  /**
   * Process Load Balancers
   */
  private processLoadBalancers(
    loadBalancers: any[],
    vpcId: string,
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void {
    const { nodes, edges } = result;
    
    // Process each Load Balancer
    loadBalancers.forEach((lb, index) => {
      // Create Load Balancer node ID
      const lbId = getResourceId('lb', lb.loadBalancerArn || `lb-${index}`, generateNodeId);
      
      // Create Load Balancer node
      const lbNode = createResourceNode(
        lbId,
        lb.loadBalancerName || `Load Balancer ${index + 1}`,
        'load_balancer',
        lbId,
        vpcId,
        0, 0, // Position will be updated by positionNodeInParent
        {
          LoadBalancerArn: lb.loadBalancerArn || '',
          LoadBalancerName: lb.loadBalancerName || '',
          VpcId: vpcId,
          Type: lb.type || '',
          Scheme: lb.scheme || ''
        }
      );
      
      // Add Load Balancer node to results
      nodes.push(lbNode);
      
      // Position Load Balancer relative to VPC
      positionNodeInParent(lbNode, nodes, vpcId);
      
      // Create edge from Load Balancer to VPC
      edges.push({
        id: generateEdgeId(),
        source: lbId,
        target: vpcId,
        type: 'smoothstep',
        data: {
          type: RelationshipType.SUBNET_TO_LB,
          description: 'Load Balancer is deployed in VPC'
        }
      });
    });
  }
} 