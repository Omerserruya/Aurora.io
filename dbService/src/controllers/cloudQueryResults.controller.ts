import { Request, Response } from 'express';
import neo4j, { Session } from 'neo4j-driver';
import { Neo4jService } from '../services/neo4j.service';
import { ConnectivityVerifier } from '../services/connectivityVerifier';
import { CloudQueryResult } from '@/types/cloudQuery.types';

// Add interface for authenticated request
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        [key: string]: any;
    };
}

interface CloudInfrastructure {
    vpcs: {
        vpcId: string;
        properties: any;
        subnets: {
            subnetId: string;
            properties: any;
            instances: {
                instanceId: string;
                properties: any;
            }[];
        }[];
        securityGroups: {
            groupId: string;
            properties: any;
        }[];
    }[];
    s3Buckets: {
        name: string;
        properties: any;
    }[];
}

interface TerraformInfrastructure {
    vpcs: {
        name: string;
        cidr_block: string;
    }[];
    subnets: {
        name: string;
        cidr_block: string;
        vpc_name: string;
    }[];
    amis: {
        name: string;
        ami_id: string;
        tags: Record<string, string>;
    }[];
    instances: {
        name: string;
        ami_id: string;
        instance_type: string;
        subnet_name: string;
        tags: Record<string, string>;
    }[];
    securityGroupRules: {
        securityGroup: {
            groupId: string;
            properties: any;
            rules: {
                ruleId: string;
                properties: any;
                ruleType: string;
            }[];
        };
    }[];
    s3Buckets: {
        name: string;
        properties: any;
    }[];
    routeTables: {
        routeTableId: string;
        vpcId: string;
        routes: {
            destinationCidrBlock: string;
            gatewayId: string;
            origin: string;
            state: string;
        }[];
        associations: {
            subnetId: string;
            main: boolean;
            state: string;
        }[];
    }[];
    internetGateways: {
        internetGatewayId: string;
        attachments: {
            vpcId: string;
            state: string;
        }[];
    }[];
    networkAcls: {
        networkAclId: string;
        vpcId: string;
        entries: {
            cidrBlock: string;
            protocol: string;
            ruleAction: string;
            ruleNumber: number;
            egress: string;
        }[];
    }[];
    loadBalancers: {
        loadBalancerArn: string;
        loadBalancerName: string;
        vpcId: string;
        type: string;
        scheme: string;
    }[];
}

interface UserGroupPair {
    UserId: string;
    GroupId: string;
}

interface IpRange {
    CidrIp: string;
}

interface Ipv6Range {
    CidrIpv6: string;
}

interface PrefixListId {
    PrefixListId: string;
}

interface SecurityGroupRule {
    IpProtocol: string;
    FromPort?: number;
    ToPort?: number;
    UserIdGroupPairs: UserGroupPair[];
    IpRanges: IpRange[];
    Ipv6Ranges: Ipv6Range[];
    PrefixListIds: PrefixListId[];
}

interface Route {
    DestinationCidrBlock: string;
    GatewayId: string;
    Origin: string;
    State: string;
}

interface RouteTableAssociation {
    Main: boolean;
    RouteTableAssociationId: string;
    RouteTableId: string;
    SubnetId: string;
    AssociationState: {
        State: string;
    };
}

interface NetworkAclEntry {
    CidrBlock: string;
    Egress: string;
    Protocol: string;
    RuleAction: string;
    RuleNumber: number;
}

interface LoadBalancer {
    LoadBalancerArn: string;
    LoadBalancerName: string;
    VpcId: string;
    Type: string;
    Scheme: string;
}

interface Relationship {
    from: {
        label: string;
        id: string;
    };
    to: {
        label: string;
        id: string;
    };
    type: string;
    properties: Record<string, any>;
}

interface SecurityGroup {
    groupId: string;
    GroupId: string;
    [key: string]: any;
}

interface RouteTable {
    routeTableId: string;
    RouteTableId: string;
    [key: string]: any;
}

interface NetworkAcl {
    networkAclId: string;
    NetworkAclId: string;
    [key: string]: any;
}

interface SimpleNode {
    id: string;
    type: string;
    label: string;
    parent?: string;
    properties: any;
}

interface SimpleConnection {
    source: string;
    target: string;
    success?: boolean;
    failureReason?: string;
    type?: string;
}

interface SimpleInfrastructure {
    nodes: SimpleNode[];
    connections: SimpleConnection[];
}

// Utility to remove unwanted keys
function omitKeys(obj: any, keys: string[]) {
    if (!obj) return obj;
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}

export const processCloudQueryResults = async (req: Request, res: Response) => {
    let session: Session | null = null;
    
    try {
        const { userId, connectionId, data }: CloudQueryResult = req.body;

        // Validate required fields
        if (!userId || !connectionId || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get a new session
        session = Neo4jService.getSession();

        console.log('Session created, about to query VPCs');

        // Start a transaction
        const tx = session.beginTransaction();

        // First, delete all existing data for this userId and connectionId pair
        await tx.run(
            `MATCH (n)
             WHERE n.userId = $userId AND n.connectionId = $connectionId
             DETACH DELETE n`,
            { userId, connectionId }
        );

        // Process each resource type
        if (data.vpcs) {
            for (const vpc of data.vpcs) {
                await tx.run(
                    `CREATE (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                     SET v += $properties`,
                    {
                        vpcId: vpc.VpcId,
                        userId,
                        connectionId,
                        properties: vpc
                    }
                );
            }
        }

        if (data.subnets) {
            for (const subnet of data.subnets) {
                await tx.run(
                    `CREATE (s:Subnet {subnetId: $subnetId, userId: $userId, connectionId: $connectionId})
                     SET s += $properties
                     WITH s
                     MATCH (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                     CREATE (v)-[:CONTAINS]->(s)`,
                    {
                        subnetId: subnet.SubnetId,
                        vpcId: subnet.VpcId,
                        userId,
                        connectionId,
                        properties: subnet
                    }
                );
            }
        }

        if (data.instances) {
            for (const instance of data.instances) {
                // Create the instance node with basic properties
                await tx.run(
                    `CREATE (i:Instance {instanceId: $instanceId, userId: $userId, connectionId: $connectionId})
                     SET i += $properties`,
                    {
                        instanceId: instance.InstanceId,
                        userId,
                        connectionId,
                        properties: {
                            instanceType: instance.InstanceType,
                            vpcId: instance.VpcId,
                            subnetId: instance.SubnetId,
                            imageId: instance.ImageId,
                            imageName: instance.ImageName,
                            imageDescription: instance.ImageDescription,
                            imageCreationDate: instance.ImageCreationDate
                        }
                    }
                );

                // Create relationship with subnet if subnetId exists
                if (instance.SubnetId) {
                    await tx.run(
                        `MATCH (i:Instance {instanceId: $instanceId, userId: $userId, connectionId: $connectionId})
                         MATCH (s:Subnet {subnetId: $subnetId, userId: $userId, connectionId: $connectionId})
                         CREATE (i)-[:BELONGS_TO]->(s)`,
                        {
                            instanceId: instance.InstanceId,
                            subnetId: instance.SubnetId,
                            userId,
                            connectionId
                        }
                    );
                }
            }
        }

        if (data.security_groups) {
            for (const sg of data.security_groups) {
                // Create the security group node with metadata only
                await tx.run(
                    `CREATE (sg:SecurityGroup {groupId: $groupId, userId: $userId, connectionId: $connectionId})
                     SET sg += $properties`,
                    {
                        groupId: sg.GroupId,
                        userId,
                        connectionId,
                        properties: {
                            groupName: sg.GroupName,
                            vpcId: sg.VpcId,
                            description: sg.Description
                        }
                    }
                );

                // Create inbound rules
                if (sg.InboundRules) {
                    for (const rule of sg.InboundRules) {
                        await tx.run(
                            `MATCH (sg:SecurityGroup {groupId: $groupId, userId: $userId, connectionId: $connectionId})
                             CREATE (r:SecurityGroupRule {ruleId: $ruleId, userId: $userId, connectionId: $connectionId})
                             SET r += $properties
                             CREATE (sg)-[:HAS_RULE {type: 'inbound'}]->(r)`,
                            {
                                groupId: sg.GroupId,
                                ruleId: `${sg.GroupId}-inbound-${rule.IpProtocol}-${rule.FromPort}-${rule.ToPort}`,
                                userId,
                                connectionId,
                                properties: {
                                    ipProtocol: rule.IpProtocol,
                                    fromPort: rule.FromPort,
                                    toPort: rule.ToPort,
                                    userIdGroupPairs: rule.UserIdGroupPairs.map((pair: UserGroupPair) => `${pair.UserId}:${pair.GroupId}`),
                                    ipRanges: rule.IpRanges.map((range: IpRange) => range.CidrIp),
                                    ipv6Ranges: rule.Ipv6Ranges.map((range: Ipv6Range) => range.CidrIpv6),
                                    prefixListIds: rule.PrefixListIds.map((pl: PrefixListId) => pl.PrefixListId)
                                }
                            }
                        );
                    }
                }

                // Create outbound rules
                if (sg.OutboundRules) {
                    for (const rule of sg.OutboundRules) {
                        await tx.run(
                            `MATCH (sg:SecurityGroup {groupId: $groupId, userId: $userId, connectionId: $connectionId})
                             CREATE (r:SecurityGroupRule {ruleId: $ruleId, userId: $userId, connectionId: $connectionId})
                             SET r += $properties
                             CREATE (sg)-[:HAS_RULE {type: 'outbound'}]->(r)`,
                            {
                                groupId: sg.GroupId,
                                ruleId: `${sg.GroupId}-outbound-${rule.IpProtocol}-${rule.FromPort}-${rule.ToPort}`,
                                userId,
                                connectionId,
                                properties: {
                                    ipProtocol: rule.IpProtocol,
                                    fromPort: rule.FromPort,
                                    toPort: rule.ToPort,
                                    userIdGroupPairs: rule.UserIdGroupPairs.map((pair: UserGroupPair) => `${pair.UserId}:${pair.GroupId}`),
                                    ipRanges: rule.IpRanges.map((range: IpRange) => range.CidrIp),
                                    ipv6Ranges: rule.Ipv6Ranges.map((range: Ipv6Range) => range.CidrIpv6),
                                    prefixListIds: rule.PrefixListIds.map((pl: PrefixListId) => pl.PrefixListId)
                                }
                            }
                        );
                    }
                }

                // Create relationship with VPC
                if (sg.VpcId) {
                    await tx.run(
                        `MATCH (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                         MATCH (sg:SecurityGroup {groupId: $groupId, userId: $userId, connectionId: $connectionId})
                         CREATE (v)-[:HAS]->(sg)`,
                        {
                            vpcId: sg.VpcId,
                            groupId: sg.GroupId,
                            userId,
                            connectionId
                        }
                    );
                }
            }
        }

        if (data.s3_buckets) {
            for (const bucket of data.s3_buckets) {
                await tx.run(
                    `CREATE (b:Bucket {name: $name, userId: $userId, connectionId: $connectionId})
                     SET b += $properties`,
                    {
                        name: bucket.Name,
                        userId,
                        connectionId,
                        properties: bucket
                    }
                );
            }
        }

        if (data.route_tables) {
            for (const rt of data.route_tables) {
                // Create the route table node with metadata only
                await tx.run(
                    `CREATE (rt:RouteTable {routeTableId: $routeTableId, userId: $userId, connectionId: $connectionId})
                     SET rt += $properties`,
                    {
                        routeTableId: rt.RouteTableId,
                        userId,
                        connectionId,
                        properties: {
                            vpcId: rt.VpcId
                        }
                    }
                );

                // Create route nodes
                if (rt.Routes) {
                    for (const route of rt.Routes) {
                        await tx.run(
                            `MATCH (rt:RouteTable {routeTableId: $routeTableId, userId: $userId, connectionId: $connectionId})
                             CREATE (r:Route {routeId: $routeId, userId: $userId, connectionId: $connectionId})
                             SET r += $properties
                             CREATE (rt)-[:HAS_ROUTE]->(r)`,
                            {
                                routeTableId: rt.RouteTableId,
                                routeId: `${rt.RouteTableId}-${route.DestinationCidrBlock}`,
                                userId,
                                connectionId,
                                properties: {
                                    destinationCidrBlock: route.DestinationCidrBlock,
                                    gatewayId: route.GatewayId,
                                    origin: route.Origin,
                                    state: route.State
                                }
                            }
                        );
                    }
                }

                // Create associations as relationships
                if (rt.Associations) {
                    for (const assoc of rt.Associations) {
                        if (assoc.SubnetId) {  // Only create association if subnetId exists
                            await tx.run(
                                `MATCH (rt:RouteTable {routeTableId: $routeTableId, userId: $userId, connectionId: $connectionId})
                                 MATCH (s:Subnet {subnetId: $subnetId, userId: $userId, connectionId: $connectionId})
                                 CREATE (s)-[:ASSOCIATED_WITH {associationId: $associationId, main: $main, state: $state}]->(rt)`,
                                {
                                    routeTableId: rt.RouteTableId,
                                    subnetId: assoc.SubnetId,
                                    associationId: assoc.RouteTableAssociationId,
                                    main: assoc.Main,
                                    state: assoc.AssociationState.State,
                                    userId,
                                    connectionId
                                }
                            );
                        }
                    }
                }

                // Create relationship with VPC
                if (rt.VpcId) {
                    await tx.run(
                        `MATCH (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                         MATCH (rt:RouteTable {routeTableId: $routeTableId, userId: $userId, connectionId: $connectionId})
                         CREATE (v)-[:HAS]->(rt)`,
                        {
                            vpcId: rt.VpcId,
                            routeTableId: rt.RouteTableId,
                            userId,
                            connectionId
                        }
                    );
                }
            }
        }

        if (data.internet_gateways) {
            // First, ensure the global internet node exists
            await tx.run(
                `MERGE (g:GlobalInternet {name: 'Internet'})`
            );

            for (const igw of data.internet_gateways) {
                // Create the internet gateway node with userId and connectionId
                await tx.run(
                    `CREATE (igw:InternetGateway {internetGatewayId: $internetGatewayId, userId: $userId, connectionId: $connectionId})`,
                    {
                        internetGatewayId: igw.InternetGatewayId,
                        userId,
                        connectionId
                    }
                );

                // Create relationship to global internet node
                await tx.run(
                    `MATCH (igw:InternetGateway {internetGatewayId: $internetGatewayId, userId: $userId, connectionId: $connectionId})
                     MATCH (g:GlobalInternet {name: 'Internet'})
                     CREATE (igw)-[:CONNECTS_TO]->(g)`,
                    {
                        internetGatewayId: igw.InternetGatewayId,
                        userId,
                        connectionId
                    }
                );

                // Create attachments as relationships
                if (igw.Attachments) {
                    for (const attachment of igw.Attachments) {
                        if (attachment.VpcId) {
                            await tx.run(
                                `MATCH (igw:InternetGateway {internetGatewayId: $internetGatewayId, userId: $userId, connectionId: $connectionId})
                                 MATCH (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                                 CREATE (igw)-[:ATTACHED_TO {state: $state}]->(v)`,
                                {
                                    internetGatewayId: igw.InternetGatewayId,
                                    vpcId: attachment.VpcId,
                                    state: attachment.State,
                                    userId,
                                    connectionId
                                }
                            );
                        }
                    }
                }
            }
        }

        if (data.network_acls) {
            for (const acl of data.network_acls) {
                // Create the network ACL node with metadata only
                await tx.run(
                    `CREATE (acl:NetworkAcl {networkAclId: $networkAclId, userId: $userId, connectionId: $connectionId})
                     SET acl += $properties`,
                    {
                        networkAclId: acl.NetworkAclId,
                        userId,
                        connectionId,
                        properties: {
                            vpcId: acl.VpcId
                        }
                    }
                );

                // Create entry nodes
                if (acl.Entries) {
                    for (const entry of acl.Entries) {
                        await tx.run(
                            `MATCH (acl:NetworkAcl {networkAclId: $networkAclId, userId: $userId, connectionId: $connectionId})
                             CREATE (e:NetworkAclEntry {entryId: $entryId, userId: $userId, connectionId: $connectionId})
                             SET e += $properties
                             CREATE (acl)-[:HAS_ENTRY {direction: $direction}]->(e)`,
                            {
                                networkAclId: acl.NetworkAclId,
                                entryId: `${acl.NetworkAclId}-${entry.RuleNumber}-${entry.Egress}`,
                                userId,
                                connectionId,
                                direction: entry.Egress ? "egress" : "ingress",
                                properties: {
                                    cidrBlock: entry.CidrBlock,
                                    protocol: entry.Protocol,
                                    ruleAction: entry.RuleAction,
                                    ruleNumber: entry.RuleNumber
                                }
                            }
                        );
                    }
                }

                // Create relationship with VPC
                if (acl.VpcId) {
                    await tx.run(
                        `MATCH (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                         MATCH (acl:NetworkAcl {networkAclId: $networkAclId, userId: $userId, connectionId: $connectionId})
                         CREATE (v)-[:HAS]->(acl)`,
                        {
                            vpcId: acl.VpcId,
                            networkAclId: acl.NetworkAclId,
                            userId,
                            connectionId
                        }
                    );
                }
            }
        }

        if (data.load_balancers) {
            for (const lb of data.load_balancers) {
                // Create the load balancer node
                await tx.run(
                    `CREATE (lb:LoadBalancer {loadBalancerArn: $loadBalancerArn, userId: $userId, connectionId: $connectionId})
                     SET lb += $properties`,
                    {
                        loadBalancerArn: lb.LoadBalancerArn,
                        userId,
                        connectionId,
                        properties: {
                            loadBalancerName: lb.LoadBalancerName,
                            type: lb.Type,
                            scheme: lb.Scheme
                        }
                    }
                );

                // Create relationship with VPC
                if (lb.VpcId) {
                    await tx.run(
                        `MATCH (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                         MATCH (lb:LoadBalancer {loadBalancerArn: $loadBalancerArn, userId: $userId, connectionId: $connectionId})
                         CREATE (lb)-[:DEPLOYED_IN]->(v)`,
                        {
                            vpcId: lb.VpcId,
                            loadBalancerArn: lb.LoadBalancerArn,
                            userId,
                            connectionId
                        }
                    );

                    // If the load balancer is internet-facing, create relationship to Internet Gateway
                    if (lb.Scheme === 'internet-facing') {
                        await tx.run(
                            `MATCH (lb:LoadBalancer {loadBalancerArn: $loadBalancerArn, userId: $userId, connectionId: $connectionId})
                             MATCH (v:VPC {vpcId: $vpcId, userId: $userId, connectionId: $connectionId})
                             MATCH (igw:InternetGateway {userId: $userId, connectionId: $connectionId})-[:ATTACHED_TO]->(v)
                             CREATE (lb)-[:ROUTED_THROUGH]->(igw)`,
                            {
                                loadBalancerArn: lb.LoadBalancerArn,
                                vpcId: lb.VpcId,
                                userId,
                                connectionId
                            }
                        );
                    }
                }
            }
        }

        // After all resources are created, verify connectivity
        console.log('Starting connectivity verification with data:', JSON.stringify(data, null, 2));
        const connectivityVerifier = new ConnectivityVerifier(data);
        const connectivityChecks = await connectivityVerifier.verifyConnectivity();
        console.log('Connectivity checks completed:', JSON.stringify(connectivityChecks, null, 2));

        // Create CAN_CONNECT relationships based on verification results
        for (const check of connectivityChecks) {
            let sourceNodeType = '';
            let targetNodeType = '';
            let sourceIdProp = '';
            let targetIdProp = '';

            // Map resource types to Neo4j node types and ID properties
            switch (check.sourceLabel) {
                case 'EC2':
                    sourceNodeType = 'Instance';
                    sourceIdProp = 'instanceId';
                    break;
                case 'S3':
                    sourceNodeType = 'Bucket';
                    sourceIdProp = 'name';
                    break;
                case 'ALB':
                    sourceNodeType = 'LoadBalancer';
                    sourceIdProp = 'loadBalancerArn';
                    break;
                case 'IGW':
                    sourceNodeType = 'InternetGateway';
                    sourceIdProp = 'internetGatewayId';
                    break;
            }

            switch (check.targetLabel) {
                case 'EC2':
                    targetNodeType = 'Instance';
                    targetIdProp = 'instanceId';
                    break;
                case 'S3':
                    targetNodeType = 'Bucket';
                    targetIdProp = 'name';
                    break;
                case 'ALB':
                    targetNodeType = 'LoadBalancer';
                    targetIdProp = 'loadBalancerArn';
                    break;
                case 'IGW':
                    targetNodeType = 'InternetGateway';
                    targetIdProp = 'internetGatewayId';
                    break;
            }

            // Create CAN_CONNECT relationship
            await tx.run(
                `MATCH (source:${sourceNodeType} {${sourceIdProp}: $sourceId, userId: $userId, connectionId: $connectionId})
                 MATCH (target:${targetNodeType} {${targetIdProp}: $targetId, userId: $userId, connectionId: $connectionId})
                 CREATE (source)-[r:CAN_CONNECT {
                     success: $success,
                     failureReason: coalesce($failureReason, ''),
                     userId: $userId,
                     connectionId: $connectionId
                 }]->(target)`,
                {
                    sourceId: check.sourceId,
                    targetId: check.targetId,
                    success: check.success,
                    failureReason: check.failureReason || '',
                    userId,
                    connectionId
                }
            );
        }

        // Commit the transaction
        await tx.commit();

        res.status(200).json({ 
            message: 'Results processed successfully',
            connectivityChecks: connectivityChecks 
        });
    } catch (error) {
        console.error('Error processing CloudQuery results:', error);
        res.status(500).json({ error: 'Failed to process results' });
    } finally {
        if (session) {
            await session.close();
        }
    }
};

export const getTerraformInfrastructureData = async (req: Request, res: Response) => {
    let session: Session | null = null;
    
    try {
        const { userId, connectionId } = req.params;
        
        // Validate required fields
        if (!userId || !connectionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get a new session
        session = Neo4jService.getSession();

        // Single comprehensive query to get all VPCs with their related resources including SecurityGroups
        const result = await session.run(
            `MATCH (v:VPC {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:CONTAINS]->(s:Subnet {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (s)<-[:BELONGS_TO]-(i:Instance {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (i)-[:USES]->(a:AMI {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:HAS]->(sg:SecurityGroup {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (sg)-[:HAS_RULE {type: 'inbound'}]->(inRule:SecurityGroupRule {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (sg)-[:HAS_RULE {type: 'outbound'}]->(outRule:SecurityGroupRule {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:HAS]->(rt:RouteTable {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (rt)-[:HAS_ROUTE]->(route:Route {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)<-[:ATTACHED_TO]-(igw:InternetGateway {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:HAS]->(acl:NetworkAcl {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (acl)-[:HAS_ENTRY]->(entry:NetworkAclEntry {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)<-[:DEPLOYED_IN]-(lb:LoadBalancer {userId: $userId, connectionId: $connectionId})
             WITH v, s, i, a, sg, inRule, outRule, rt, route, igw, acl, entry, lb
             RETURN v, s, i, a, sg, inRule, outRule, rt, route, igw, acl, entry, lb`,
            { userId, connectionId }
        );

        const infrastructure: TerraformInfrastructure = {
            vpcs: [],
            subnets: [],
            amis: [],
            instances: [],
            securityGroupRules: [],
            s3Buckets: [],
            routeTables: [],
            internetGateways: [],
            networkAcls: [],
            loadBalancers: []
        };

        // Process the results using Maps to avoid duplicates
        const vpcsMap = new Map();
        const subnetsMap = new Map();
        const amisMap = new Map();
        const instancesMap = new Map();
        const securityGroupsMap = new Map();
        const routeTablesMap = new Map();
        const internetGatewaysMap = new Map();
        const networkAclsMap = new Map();
        const loadBalancersMap = new Map();

        result.records.forEach((record: any) => {
            const vpc = record.get('v');
            const subnet = record.get('s');
            const instance = record.get('i');
            const ami = record.get('a');
            const securityGroup = record.get('sg');
            const inboundRule = record.get('inRule');
            const outboundRule = record.get('outRule');
            const routeTable = record.get('rt');
            const route = record.get('route');
            const internetGateway = record.get('igw');
            const networkAcl = record.get('acl');
            const aclEntry = record.get('entry');
            const loadBalancer = record.get('lb');

            // Process VPC
            if (vpc && !vpcsMap.has(vpc.properties.vpcId)) {
                vpcsMap.set(vpc.properties.vpcId, {
                    name: vpc.properties.Name || vpc.properties.vpcId,
                    cidr_block: vpc.properties.CidrBlock,
                    vpcId: vpc.properties.vpcId
                });
            }

            // Process Subnet
            if (subnet && !subnetsMap.has(subnet.properties.subnetId)) {
                subnetsMap.set(subnet.properties.subnetId, {
                    name: subnet.properties.Name || subnet.properties.subnetId,
                    cidr_block: subnet.properties.CidrBlock,
                    vpc_name: vpc ? (vpc.properties.Name || vpc.properties.vpcId) : '',
                    subnetId: subnet.properties.subnetId
                });
            }

            // Process AMI
            if (ami && !amisMap.has(ami.properties.imageId)) {
                amisMap.set(ami.properties.imageId, {
                    name: ami.properties.Name || ami.properties.imageId,
                    ami_id: ami.properties.imageId,
                    tags: ami.properties.Tags || {}
                });
            }

            // Process Instance
            if (instance && !instancesMap.has(instance.properties.instanceId)) {
                const relatedSubnet = subnet || subnetsMap.get(instance.properties.subnetId);
                instancesMap.set(instance.properties.instanceId, {
                    name: instance.properties.Name || instance.properties.instanceId,
                    ami_id: instance.properties.imageId,
                    instance_type: instance.properties.instanceType,
                    subnet_name: relatedSubnet ? (relatedSubnet.properties?.Name || relatedSubnet.properties?.subnetId || relatedSubnet.name) : '',
                    tags: instance.properties.Tags || {}
                });
            }

            // Process SecurityGroup and Rules
            if (securityGroup) {
                const groupId = securityGroup.properties.groupId;
                
                if (!securityGroupsMap.has(groupId)) {
                    securityGroupsMap.set(groupId, {
                        securityGroup: {
                            groupId: groupId,
                            properties: securityGroup.properties,
                            rules: []
                        }
                    });
                }

                const sgData = securityGroupsMap.get(groupId);

                // Process inbound rules
                if (inboundRule) {
                    const ruleId = `${groupId}-ingress-${inboundRule.properties.ipProtocol}-${inboundRule.properties.fromPort}-${inboundRule.properties.toPort}`;
                    const existingRule = sgData.securityGroup.rules.find((r: any) => r.ruleId === ruleId);
                    
                    if (!existingRule) {
                        sgData.securityGroup.rules.push({
                            ruleId: ruleId,
                            properties: inboundRule.properties,
                            ruleType: 'ingress'
                        });
                    }
                }

                // Process outbound rules
                if (outboundRule) {
                    const ruleId = `${groupId}-egress-${outboundRule.properties.ipProtocol}-${outboundRule.properties.fromPort}-${outboundRule.properties.toPort}`;
                    const existingRule = sgData.securityGroup.rules.find((r: any) => r.ruleId === ruleId);
                    
                    if (!existingRule) {
                        sgData.securityGroup.rules.push({
                            ruleId: ruleId,
                            properties: outboundRule.properties,
                            ruleType: 'egress'
                        });
                    }
                }
            }

            // Process Route Tables
            if (routeTable && !routeTablesMap.has(routeTable.properties.routeTableId)) {
                const rtData = {
                    routeTableId: routeTable.properties.routeTableId,
                    vpcId: routeTable.properties.vpcId,
                    routes: [],
                    associations: []
                };
                routeTablesMap.set(routeTable.properties.routeTableId, rtData);
            }

            // Process Routes
            if (route && routeTable) {
                const rtData = routeTablesMap.get(routeTable.properties.routeTableId);
                if (rtData) {
                    const existingRoute = rtData.routes.find((r: any) => 
                        r.destinationCidrBlock === route.properties.destinationCidrBlock &&
                        r.gatewayId === route.properties.gatewayId
                    );
                    
                    if (!existingRoute) {
                        rtData.routes.push({
                            destinationCidrBlock: route.properties.destinationCidrBlock,
                            gatewayId: route.properties.gatewayId,
                            origin: route.properties.origin,
                            state: route.properties.state
                        });
                    }
                }
            }

            // Process Internet Gateways
            if (internetGateway && !internetGatewaysMap.has(internetGateway.properties.internetGatewayId)) {
                internetGatewaysMap.set(internetGateway.properties.internetGatewayId, {
                    internetGatewayId: internetGateway.properties.internetGatewayId,
                    attachments: vpc ? [{
                        vpcId: vpc.properties.vpcId,
                        state: 'attached'
                    }] : []
                });
            }

            // Process Network ACLs
            if (networkAcl && !networkAclsMap.has(networkAcl.properties.networkAclId)) {
                const aclData = {
                    networkAclId: networkAcl.properties.networkAclId,
                    vpcId: networkAcl.properties.vpcId,
                    entries: []
                };
                networkAclsMap.set(networkAcl.properties.networkAclId, aclData);
            }

            // Process Network ACL Entries
            if (aclEntry && networkAcl) {
                const aclData = networkAclsMap.get(networkAcl.properties.networkAclId);
                if (aclData) {
                    const existingEntry = aclData.entries.find((e: any) => 
                        e.ruleNumber === aclEntry.properties.ruleNumber &&
                        e.egress === aclEntry.properties.egress
                    );
                    
                    if (!existingEntry) {
                        aclData.entries.push({
                            cidrBlock: aclEntry.properties.cidrBlock,
                            protocol: aclEntry.properties.protocol,
                            ruleAction: aclEntry.properties.ruleAction,
                            ruleNumber: aclEntry.properties.ruleNumber,
                            egress: aclEntry.properties.egress
                        });
                    }
                }
            }

            // Process Load Balancers
            if (loadBalancer && !loadBalancersMap.has(loadBalancer.properties.loadBalancerArn)) {
                loadBalancersMap.set(loadBalancer.properties.loadBalancerArn, {
                    loadBalancerArn: loadBalancer.properties.loadBalancerArn,
                    loadBalancerName: loadBalancer.properties.loadBalancerName,
                    vpcId: vpc ? vpc.properties.vpcId : '',
                    type: loadBalancer.properties.type,
                    scheme: loadBalancer.properties.scheme
                });
            }
        });

        // Get S3 buckets separately since they're not VPC-related
        const bucketResult = await session.run(
            `MATCH (b:Bucket {userId: $userId, connectionId: $connectionId})
             RETURN b`,
            { userId, connectionId }
        );

        const s3BucketsMap = new Map();
        bucketResult.records.forEach((record: any) => {
            const bucket = record.get('b');
            if (bucket && !s3BucketsMap.has(bucket.properties.name)) {
                s3BucketsMap.set(bucket.properties.name, {
                    name: bucket.properties.name,
                    properties: bucket.properties
                });
            }
        });

        // Convert Maps to arrays
        infrastructure.vpcs = Array.from(vpcsMap.values());
        infrastructure.subnets = Array.from(subnetsMap.values());
        infrastructure.amis = Array.from(amisMap.values());
        infrastructure.instances = Array.from(instancesMap.values());
        infrastructure.securityGroupRules = Array.from(securityGroupsMap.values());
        infrastructure.s3Buckets = Array.from(s3BucketsMap.values());
        infrastructure.routeTables = Array.from(routeTablesMap.values());
        infrastructure.internetGateways = Array.from(internetGatewaysMap.values());
        infrastructure.networkAcls = Array.from(networkAclsMap.values());
        infrastructure.loadBalancers = Array.from(loadBalancersMap.values());

        res.status(200).json(infrastructure);
    } catch (error) {
        console.error('Error fetching Terraform infrastructure data:', error);
        res.status(500).json({ error: 'Failed to fetch infrastructure data' });
    } finally {
        if (session) {
            await session.close();
        }
    }
};

export const getInfrastructureDataWithUserId = async (req: Request, res: Response) => {
    let session: Session | null = null;
    
    try {
        const { userId, connectionId } = req.params;
        
        if (!userId || !connectionId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        session = Neo4jService.getSession();
        
        // Query to get all VPCs and their related resources
        const result = await session.run(
            `MATCH (v:VPC {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:CONTAINS]->(s:Subnet {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (s)<-[:BELONGS_TO]-(i:Instance {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:HAS]->(sg:SecurityGroup {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (sg)-[:HAS_RULE {type: 'inbound'}]->(inRule:SecurityGroupRule {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (sg)-[:HAS_RULE {type: 'outbound'}]->(outRule:SecurityGroupRule {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:HAS]->(rt:RouteTable {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (rt)-[:HAS_ROUTE]->(route:Route {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (s)-[:ASSOCIATED_WITH]->(rt)
             OPTIONAL MATCH (v)<-[:ATTACHED_TO]-(igw:InternetGateway {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:HAS]->(acl:NetworkAcl {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (acl)-[:HAS_ENTRY]->(entry:NetworkAclEntry {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)<-[:DEPLOYED_IN]-(lb:LoadBalancer {userId: $userId, connectionId: $connectionId})
             WITH v, s, i, sg, inRule, outRule, rt, route, igw, acl, entry, lb
             RETURN v, s, i, sg, inRule, outRule, rt, route, igw, acl, entry, lb`,
            { userId, connectionId }
        );
        
        // Process the results
        const vpcs = new Map();
        const subnets = new Map();
        const instances = new Map();
        const securityGroups = new Map();
        const routeTables = new Map();
        const internetGateways = new Map();
        const networkAcls = new Map();
        const loadBalancers = new Map();
        
        result.records.forEach((record: any) => {
            const vpc = record.get('v');
            const subnet = record.get('s');
            const instance = record.get('i');
            const securityGroup = record.get('sg');
            const inboundRule = record.get('inRule');
            const outboundRule = record.get('outRule');
            const routeTable = record.get('rt');
            const route = record.get('route');
            const internetGateway = record.get('igw');
            const networkAcl = record.get('acl');
            const aclEntry = record.get('entry');
            const loadBalancer = record.get('lb');
            
            if (vpc) {
                if (!vpcs.has(vpc.properties.vpcId)) {
                    vpcs.set(vpc.properties.vpcId, {
                        vpcId: vpc.properties.vpcId,
                        properties: vpc.properties,
                        subnets: [],
                        securityGroups: [],
                        routeTables: [],
                        internetGateways: [],
                        networkAcls: [],
                        loadBalancers: []
                    });
                }
            }
            
            if (subnet) {
                if (!subnets.has(subnet.properties.subnetId)) {
                    subnets.set(subnet.properties.subnetId, {
                        subnetId: subnet.properties.subnetId,
                        properties: subnet.properties,
                        instances: [],
                        routeTables: []
                    });
                    
                    const vpcData = vpcs.get(vpc.properties.vpcId);
                    if (vpcData) {
                        vpcData.subnets.push(subnets.get(subnet.properties.subnetId));
                    }
                }
            }
            
            if (instance) {
                if (!instances.has(instance.properties.instanceId)) {
                    instances.set(instance.properties.instanceId, {
                        instanceId: instance.properties.instanceId,
                        properties: instance.properties
                    });
                    
                    const subnetData = subnets.get(subnet.properties.subnetId);
                    if (subnetData) {
                        subnetData.instances.push(instances.get(instance.properties.instanceId));
                    }
                }
            }
            
            if (securityGroup) {
                if (!securityGroups.has(securityGroup.properties.groupId)) {
                    securityGroups.set(securityGroup.properties.groupId, {
                        groupId: securityGroup.properties.groupId,
                        properties: securityGroup.properties,
                        inboundRules: [],
                        outboundRules: []
                    });
                    
                    const vpcData = vpcs.get(vpc.properties.vpcId);
                    if (vpcData) {
                        vpcData.securityGroups.push(securityGroups.get(securityGroup.properties.groupId));
                    }
                }
                
                const sgData = securityGroups.get(securityGroup.properties.groupId);
                
                if (inboundRule) {
                    const ruleData = {
                        ipProtocol: inboundRule.properties.ipProtocol,
                        fromPort: inboundRule.properties.fromPort,
                        toPort: inboundRule.properties.toPort,
                        userIdGroupPairs: inboundRule.properties.userIdGroupPairs || [],
                        ipRanges: inboundRule.properties.ipRanges || [],
                        ipv6Ranges: inboundRule.properties.ipv6Ranges || [],
                        prefixListIds: inboundRule.properties.prefixListIds || []
                    };
                    
                    // Check if this rule already exists
                    const existingRule = sgData.inboundRules.find((r: { ipProtocol: string; fromPort?: number; toPort?: number }) => 
                        r.ipProtocol === ruleData.ipProtocol &&
                        r.fromPort === ruleData.fromPort &&
                        r.toPort === ruleData.toPort
                    );
                    
                    if (!existingRule) {
                        sgData.inboundRules.push(ruleData);
                    }
                }
                
                if (outboundRule) {
                    const ruleData = {
                        ipProtocol: outboundRule.properties.ipProtocol,
                        fromPort: outboundRule.properties.fromPort,
                        toPort: outboundRule.properties.toPort,
                        userIdGroupPairs: outboundRule.properties.userIdGroupPairs || [],
                        ipRanges: outboundRule.properties.ipRanges || [],
                        ipv6Ranges: outboundRule.properties.ipv6Ranges || [],
                        prefixListIds: outboundRule.properties.prefixListIds || []
                    };
                    
                    // Check if this rule already exists
                    const existingRule = sgData.outboundRules.find((r: { ipProtocol: string; fromPort?: number; toPort?: number }) => 
                        r.ipProtocol === ruleData.ipProtocol &&
                        r.fromPort === ruleData.fromPort &&
                        r.toPort === ruleData.toPort
                    );
                    
                    if (!existingRule) {
                        sgData.outboundRules.push(ruleData);
                    }
                }
            }
            
            if (routeTable) {
                if (!routeTables.has(routeTable.properties.routeTableId)) {
                    routeTables.set(routeTable.properties.routeTableId, {
                        routeTableId: routeTable.properties.routeTableId,
                        properties: routeTable.properties,
                        routes: [],
                        associations: []
                    });
                    
                    const vpcData = vpcs.get(vpc.properties.vpcId);
                    if (vpcData) {
                        vpcData.routeTables.push(routeTables.get(routeTable.properties.routeTableId));
                    }
                }
                
                const rtData = routeTables.get(routeTable.properties.routeTableId);
                
                if (route) {
                    rtData.routes.push({
                        destinationCidrBlock: route.properties.destinationCidrBlock,
                        gatewayId: route.properties.gatewayId,
                        origin: route.properties.origin,
                        state: route.properties.state
                    });
                }
                
                if (subnet) {
                    rtData.associations.push({
                        subnetId: subnet.properties.subnetId,
                        main: subnet.properties.main || false,
                        state: subnet.properties.state || 'active'
                    });
                }
            }
            
            if (internetGateway) {
                if (!internetGateways.has(internetGateway.properties.internetGatewayId)) {
                    internetGateways.set(internetGateway.properties.internetGatewayId, {
                        internetGatewayId: internetGateway.properties.internetGatewayId,
                        properties: internetGateway.properties,
                        attachments: []
                    });
                    
                    const vpcData = vpcs.get(vpc.properties.vpcId);
                    if (vpcData) {
                        vpcData.internetGateways.push(internetGateways.get(internetGateway.properties.internetGatewayId));
                    }
                }
                
                const igwData = internetGateways.get(internetGateway.properties.internetGatewayId);
                igwData.attachments.push({
                    vpcId: vpc.properties.vpcId,
                    state: internetGateway.properties.state || 'attached'
                });
            }
            
            if (networkAcl) {
                if (!networkAcls.has(networkAcl.properties.networkAclId)) {
                    networkAcls.set(networkAcl.properties.networkAclId, {
                        networkAclId: networkAcl.properties.networkAclId,
                        properties: networkAcl.properties,
                        entries: []
                    });
                    
                    const vpcData = vpcs.get(vpc.properties.vpcId);
                    if (vpcData && !vpcData.networkAcls.some((acl: any) => acl.networkAclId === networkAcl.properties.networkAclId)) {
                        vpcData.networkAcls.push(networkAcls.get(networkAcl.properties.networkAclId));
                    }
                }
                
                const aclData = networkAcls.get(networkAcl.properties.networkAclId);
                
                if (aclEntry) {
                    aclData.entries.push({
                        cidrBlock: aclEntry.properties.cidrBlock,
                        egress: aclEntry.properties.egress,
                        protocol: aclEntry.properties.protocol,
                        ruleAction: aclEntry.properties.ruleAction,
                        ruleNumber: aclEntry.properties.ruleNumber
                    });
                }
            }
            
            if (loadBalancer) {
                if (!loadBalancers.has(loadBalancer.properties.loadBalancerArn)) {
                    loadBalancers.set(loadBalancer.properties.loadBalancerArn, {
                        loadBalancerArn: loadBalancer.properties.loadBalancerArn,
                        properties: loadBalancer.properties
                    });
                    
                    const vpcData = vpcs.get(vpc.properties.vpcId);
                    if (vpcData && !vpcData.loadBalancers.some((lb: any) => lb.loadBalancerArn === loadBalancer.properties.loadBalancerArn)) {
                        vpcData.loadBalancers.push(loadBalancers.get(loadBalancer.properties.loadBalancerArn));
                    }
                }
            }
        });
        
        // Get S3 buckets
        const bucketResult = await session.run(
            `MATCH (b:S3Bucket {userId: $userId, connectionId: $connectionId})
             RETURN b`,
            { userId, connectionId }
        );
        
        const buckets = bucketResult.records.map((record: any) => ({
            name: record.get('b').properties.name,
            properties: record.get('b').properties
        }));
        
        res.json({
            vpcs: Array.from(vpcs.values()),
            s3Buckets: buckets
        });
        
    } catch (error) {
        console.error('Error retrieving infrastructure data:', error);
        res.status(500).json({ error: 'Failed to retrieve infrastructure data' });
    } finally {
        if (session) {
            await session.close();
        }
    }
};

export const getInfrastructureData = async (req: AuthenticatedRequest, res: Response) => {
    const { userId, connectionId } = req.params;
    
    if (!userId || !connectionId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = Neo4jService.getSession();
    try {
        // Query to get all resources, excluding security-related nodes
        const result = await session.executeRead(tx =>
            tx.run(
                `MATCH (v:VPC {userId: $userId, connectionId: $connectionId})
                 OPTIONAL MATCH (v)-[:CONTAINS]->(s:Subnet)
                 OPTIONAL MATCH (s)<-[:BELONGS_TO]-(i:Instance)
                 OPTIONAL MATCH (v)<-[:ATTACHED_TO]-(igw:InternetGateway)
                 OPTIONAL MATCH (igw)-[:CONNECTS_TO]->(g:GlobalInternet)
                 OPTIONAL MATCH (v)<-[:DEPLOYED_IN]-(lb:LoadBalancer)
                 OPTIONAL MATCH (b:Bucket {userId: $userId, connectionId: $connectionId})
                 OPTIONAL MATCH (source)-[r:CAN_CONNECT]->(target)
                 WHERE (source:Instance OR source:LoadBalancer OR source:InternetGateway OR source:Bucket)
                 AND (target:Instance OR target:LoadBalancer OR target:InternetGateway OR target:Bucket)
                 AND source.userId = $userId AND source.connectionId = $connectionId
                 AND target.userId = $userId AND target.connectionId = $connectionId
                 RETURN v, s, i, igw, g, lb, collect(DISTINCT b) as buckets, 
                        collect(DISTINCT {source: source, target: target, success: r.success, failureReason: r.failureReason}) as connections`,
                { userId, connectionId }
            )
        );

        const nodes: SimpleNode[] = [];
        const connections: SimpleConnection[] = [];
        const processedIds = new Set<string>();

        // Add global internet node
        const globalInternetId = 'global-internet';
        nodes.push({
            id: globalInternetId,
            type: 'internet',
            label: 'Internet',
            properties: {
                name: 'Internet'
            }
        });
        processedIds.add(globalInternetId);

        result.records.forEach(record => {
            // Process VPC
            const vpc = record.get('v');
            if (vpc && !processedIds.has(vpc.properties.vpcId)) {
                nodes.push({
                    id: vpc.properties.vpcId,
                    type: 'vpc',
                    label: vpc.properties.CidrBlock || vpc.properties.vpcId,
                    properties: {
                        VpcId: vpc.properties.vpcId,
                        CidrBlock: vpc.properties.CidrBlock,
                        ...omitKeys(vpc.properties, ['userId', 'connectionId', 'vpcId'])
                    }
                });
                processedIds.add(vpc.properties.vpcId);
            }

            // Process Subnet
            const subnet = record.get('s');
            if (subnet && !processedIds.has(subnet.properties.subnetId)) {
                nodes.push({
                    id: subnet.properties.subnetId,
                    type: 'subnet',
                    label: subnet.properties.CidrBlock || subnet.properties.subnetId,
                    parent: vpc.properties.vpcId,
                    properties: {
                        SubnetId: subnet.properties.subnetId,
                        VpcId: vpc.properties.vpcId,
                        CidrBlock: subnet.properties.CidrBlock,
                        ...omitKeys(subnet.properties, ['userId', 'connectionId', 'subnetId'])
                    }
                });
                processedIds.add(subnet.properties.subnetId);
            }

            // Process Instance
            const instance = record.get('i');
            if (instance && !processedIds.has(instance.properties.instanceId)) {
                nodes.push({
                    id: instance.properties.instanceId,
                    type: 'ec2',
                    label: instance.properties.instanceType || instance.properties.instanceId,
                    parent: subnet?.properties.subnetId,
                    properties: {
                        InstanceId: instance.properties.instanceId,
                        InstanceType: instance.properties.instanceType,
                        VpcId: vpc.properties.vpcId,
                        SubnetId: subnet?.properties.subnetId,
                        ImageId: instance.properties.imageId,
                        ImageName: instance.properties.imageName,
                        ImageDescription: instance.properties.imageDescription,
                        ImageCreationDate: instance.properties.imageCreationDate,
                        ...omitKeys(instance.properties, [
                            'userId', 
                            'connectionId', 
                            'instanceId', 
                            'imageId', 
                            'imageName', 
                            'imageDescription', 
                            'imageCreationDate'
                        ])
                    }
                });
                processedIds.add(instance.properties.instanceId);
            }

            // Process Internet Gateway
            const igw = record.get('igw');
            if (igw && !processedIds.has(igw.properties.internetGatewayId)) {
                nodes.push({
                    id: igw.properties.internetGatewayId,
                    type: 'internetgateway',
                    label: 'Internet Gateway',
                    parent: vpc.properties.vpcId,
                    properties: {
                        InternetGatewayId: igw.properties.internetGatewayId,
                        Attachments: [{
                            VpcId: vpc.properties.vpcId,
                            State: 'attached'
                        }],
                        ...omitKeys(igw.properties, ['userId', 'connectionId', 'internetGatewayId'])
                    }
                });
                processedIds.add(igw.properties.internetGatewayId);

                // Connect IGW to global internet
                connections.push({
                    source: igw.properties.internetGatewayId,
                    target: globalInternetId
                });
            }

            // Process Load Balancer
            const lb = record.get('lb');
            if (lb && !processedIds.has(lb.properties.loadBalancerArn)) {
                nodes.push({
                    id: lb.properties.loadBalancerArn,
                    type: 'alb',
                    label: lb.properties.loadBalancerName || 'Application Load Balancer',
                    parent: subnet?.properties.subnetId,
                    properties: {
                        LoadBalancerArn: lb.properties.loadBalancerArn,
                        LoadBalancerName: lb.properties.loadBalancerName,
                        VpcId: vpc.properties.vpcId,
                        Type: lb.properties.type || 'application',
                        Scheme: lb.properties.scheme,
                        ...omitKeys(lb.properties, ['userId', 'connectionId', 'loadBalancerArn', 'loadBalancerName'])
                    }
                });
                processedIds.add(lb.properties.loadBalancerArn);

                // If internet-facing, connect to IGW
                if (lb.properties.scheme === 'internet-facing' && igw) {
                    connections.push({
                        source: lb.properties.loadBalancerArn,
                        target: igw.properties.internetGatewayId
                    });
                }
            }

            // Process S3 Buckets
            const buckets = record.get('buckets');
            if (buckets && buckets.length > 0) {
                buckets.forEach((bucket: any) => {
                    if (bucket && !processedIds.has(bucket.properties.name)) {
                        nodes.push({
                            id: bucket.properties.name,
                            type: 's3bucket',
                            label: bucket.properties.name || 'S3 Bucket',
                            properties: {
                                Name: bucket.properties.name,
                                CreationDate: bucket.properties.creationDate,
                                ...omitKeys(bucket.properties, ['userId', 'connectionId', 'name'])
                            }
                        });
                        processedIds.add(bucket.properties.name);
                    }
                });
            }

            // Process CAN_CONNECT relationships
            const canConnectRelationships = record.get('connections');
            console.log('Found CAN_CONNECT relationships:', JSON.stringify(canConnectRelationships, null, 2));
            if (canConnectRelationships && canConnectRelationships.length > 0) {
                canConnectRelationships.forEach((conn: any) => {
                    if (conn && conn.source && conn.target) {
                        console.log('Processing connection:', {
                            source: conn.source,
                            target: conn.target,
                            success: conn.success,
                            failureReason: conn.failureReason
                        });
                        const sourceId = conn.source.properties.instanceId || 
                                       conn.source.properties.loadBalancerArn || 
                                       conn.source.properties.internetGatewayId ||
                                       conn.source.properties.name;
                        const targetId = conn.target.properties.instanceId || 
                                       conn.target.properties.loadBalancerArn || 
                                       conn.target.properties.internetGatewayId ||
                                       conn.target.properties.name;
                        
                        console.log('Extracted IDs:', { sourceId, targetId });
                        if (sourceId && targetId) {
                            connections.push({
                                source: sourceId,
                                target: targetId,
                                success: conn.success,
                                failureReason: conn.failureReason,
                                type: 'CAN_CONNECT'
                            });
                        }
                    }
                });
            }
        });

        // Return the simplified infrastructure
        const simpleInfrastructure: SimpleInfrastructure = {
            nodes,
            connections
        };

        res.json(simpleInfrastructure);
    } catch (error) {
        console.error('Error fetching simple infrastructure data:', error);
        res.status(500).json({ error: 'Failed to fetch infrastructure data' });
    } finally {
        await session.close();
    }
}; 