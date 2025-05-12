import { ConversionResult } from '../types';
import { createResourceNode } from '../utils/nodeFactory';
import { createLambdaToApiGwEdge } from '../utils/edgeFactory';
import { 
  ResourceProcessor, 
  getResourceId, 
  positionNodeInParent
} from './baseProcessor';

/**
 * Processor for AWS Lambda function resources
 */
export default class LambdaProcessor implements ResourceProcessor {
  /**
   * Process Lambda function resources
   */
  process(
    lambdaFunctions: any[],
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string,
    vpcId?: string, // Optional VPC ID if Lambda is inside a VPC
    apiGatewayId?: string // Optional API Gateway ID if Lambda is integrated with API Gateway
  ): void {
    if (!lambdaFunctions || lambdaFunctions.length === 0) return;
    
    const { nodes, edges } = result;
    
    // Process each Lambda function
    lambdaFunctions.forEach((lambda, index) => {
      // Create Lambda node ID
      const lambdaId = getResourceId('lambda', lambda.functionName, generateNodeId);
      
      // Create Lambda node
      const lambdaNode = createResourceNode(
        lambdaId,
        lambda.name || lambda.functionName || `Lambda ${index + 1}`,
        'lambda_function',
        lambdaId,
        vpcId, // parentNode ID (optional)
        0, 0, // position will be updated by positionNodeInParent if there's a parent
        {
          FunctionName: lambda.functionName || '',
          FunctionArn: lambda.functionArn || '',
          Runtime: lambda.runtime || '',
          VpcConfig: lambda.vpcConfig || null
        }
      );
      
      // Add Lambda node to results
      nodes.push(lambdaNode);
      
      // Position Lambda relative to its parent (if any)
      if (vpcId) {
        positionNodeInParent(lambdaNode, nodes, vpcId);
        
        // Create edge from Lambda to VPC
        edges.push({
          id: generateEdgeId(),
          source: lambdaId,
          target: vpcId,
          type: 'smoothstep',
          data: {
            type: 'lambda-to-apigw', // Using an existing edge type
            description: 'Lambda is in VPC'
          }
        });
      }
      
      // If this Lambda is integrated with an API Gateway, create an edge
      if (apiGatewayId) {
        edges.push(
          createLambdaToApiGwEdge(
            lambdaId,
            apiGatewayId,
            generateEdgeId
          )
        );
      }
      
      // Process event sources
      if (lambda.eventSources && lambda.eventSources.length > 0) {
        this.processEventSources(
          lambda.eventSources,
          lambdaId,
          result,
          generateNodeId,
          generateEdgeId
        );
      }
    });
  }
  
  /**
   * Process Lambda event sources
   */
  private processEventSources(
    eventSources: any[],
    lambdaId: string,
    result: ConversionResult,
    generateNodeId: () => string,
    generateEdgeId: () => string
  ): void {
    const { edges } = result;
    
    // Process each event source
    eventSources.forEach(eventSource => {
      const sourceId = eventSource.sourceId || eventSource.id;
      
      if (sourceId) {
        // Create edge from event source to Lambda
        edges.push({
          id: generateEdgeId(),
          source: sourceId,
          target: lambdaId,
          type: 'smoothstep',
          data: {
            type: 'lambda-to-event',
            description: `Lambda triggered by ${eventSource.type || 'event'}`
          }
        });
      }
    });
  }
} 