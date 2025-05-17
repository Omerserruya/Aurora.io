import { Request, Response } from 'express';
import neo4j, { Session } from 'neo4j-driver';
import { Neo4jService } from '../services/neo4j.service';

interface CloudQueryResult {
    userId: string;
    connectionId: string;
    data: {
        instances?: any[];
        vpcs?: any[];
        subnets?: any[];
        security_groups?: any[];
        s3_buckets?: any[];
        route_tables?: any[];
        internet_gateways?: any[];
        network_acls?: any[];
        load_balancers?: any[];
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
                                direction: entry.Egress === "TRUE" ? "egress" : "ingress",
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

        // Commit the transaction
        await tx.commit();

        res.status(200).json({ message: 'Results processed successfully' });
    } catch (error) {
        console.error('Error processing CloudQuery results:', error);
        res.status(500).json({ error: 'Failed to process results' });
    } finally {
        if (session) {
            await session.close();
        }
    }
};

export const getInfrastructureData = async (req: Request, res: Response) => {
    const { connectionId } = req.params;
    const userId = req.user?.id;

    if (!userId || !connectionId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = Neo4jService.getSession();
    try {
        // Using the more comprehensive query similar to getInfrastructureDataWithUserId
        const result = await session.executeRead(tx =>
            tx.run(
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
                 OPTIONAL MATCH (b:Bucket {userId: $userId, connectionId: $connectionId})
                 WITH v, s, i, sg, inRule, outRule, rt, route, igw, acl, entry, lb, b
                 RETURN v, s, i, sg, inRule, outRule, rt, route, igw, acl, entry, lb, collect(DISTINCT b) as buckets`,
                { userId, connectionId }
            )
        );
        
        // Process the results into the expected AWSArchitecture format
        const vpcs = new Map();
        const subnets = new Map();
        const instances = new Map();
        const securityGroups = new Map();
        const routeTables = new Map();
        const internetGateways = new Map();
        const networkAcls = new Map();
        const loadBalancers = new Map();
        const s3Buckets = [];
        
        // Process all records to collect resources
        result.records.forEach(record => {
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
            const networkAclEntry = record.get('entry');
            const loadBalancer = record.get('lb');
            
            // Add the buckets from the first record only (to avoid duplicates)
            if (record.keys.includes('buckets') && s3Buckets.length === 0) {
                const buckets = record.get('buckets');
                if (buckets && buckets.length > 0) {
                    buckets.forEach((bucket: any) => {
                        if (bucket && bucket.properties) {
                            s3Buckets.push({
                                name: bucket.properties.name || bucket.properties.BucketName,
                                properties: bucket.properties
                            });
                        }
                    });
                }
            }
            
            // Process VPC
            if (vpc && vpc.properties) {
                const vpcId = vpc.properties.vpcId;
                if (!vpcs.has(vpcId)) {
                    vpcs.set(vpcId, {
                        vpcId: vpcId,
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
            
            // Process Subnet
            if (subnet && subnet.properties) {
                const subnetId = subnet.properties.subnetId;
                if (!subnets.has(subnetId)) {
                    subnets.set(subnetId, {
                        subnetId: subnetId,
                        properties: subnet.properties,
                        instances: []
                    });
                    
                    // Link subnet to VPC
                    if (vpc && vpc.properties) {
                        const vpcData = vpcs.get(vpc.properties.vpcId);
                        if (vpcData) {
                            vpcData.subnets.push(subnets.get(subnetId));
                        }
                    }
                }
            }
            
            // Process Instance
            if (instance && instance.properties) {
                const instanceId = instance.properties.instanceId;
                if (!instances.has(instanceId)) {
                    instances.set(instanceId, {
                        instanceId: instanceId,
                        properties: instance.properties
                    });
                    
                    // Link instance to subnet
                    if (subnet && subnet.properties) {
                        const subnetData = subnets.get(subnet.properties.subnetId);
                        if (subnetData) {
                            subnetData.instances.push(instances.get(instanceId));
                        }
                    }
                }
            }
            
            // Process Security Group
            if (securityGroup && securityGroup.properties) {
                const groupId = securityGroup.properties.groupId || securityGroup.properties.GroupId;
                if (!securityGroups.has(groupId)) {
                    securityGroups.set(groupId, {
                        groupId: groupId,
                        properties: securityGroup.properties,
                        inboundRules: [],
                        outboundRules: []
                    });
                    
                    // Link security group to VPC
                    if (vpc && vpc.properties) {
                        const vpcData = vpcs.get(vpc.properties.vpcId);
                        if (vpcData) {
                            vpcData.securityGroups.push(securityGroups.get(groupId));
                        }
                    }
                }
                
                // Process Security Group Rules
                const sgData = securityGroups.get(groupId);
                if (inboundRule && inboundRule.properties && !sgData.inboundRules.some((r: any) => r.ruleId === inboundRule.properties.ruleId)) {
                    sgData.inboundRules.push(inboundRule.properties);
                }
                if (outboundRule && outboundRule.properties && !sgData.outboundRules.some((r: any) => r.ruleId === outboundRule.properties.ruleId)) {
                    sgData.outboundRules.push(outboundRule.properties);
                }
            }
            
            // Process Route Table
            if (routeTable && routeTable.properties) {
                const routeTableId = routeTable.properties.routeTableId || routeTable.properties.RouteTableId;
                if (!routeTables.has(routeTableId)) {
                    routeTables.set(routeTableId, {
                        routeTableId: routeTableId,
                        properties: routeTable.properties,
                        routes: []
                    });
                    
                    // Link route table to VPC
                    if (vpc && vpc.properties) {
                        const vpcData = vpcs.get(vpc.properties.vpcId);
                        if (vpcData && !vpcData.routeTables.some((rt: any) => rt.routeTableId === routeTableId)) {
                            vpcData.routeTables.push(routeTables.get(routeTableId));
                        }
                    }
                }
                
                // Add routes to route table
                if (route && route.properties) {
                    const rtData = routeTables.get(routeTableId);
                    if (rtData && !rtData.routes.some((r: any) => r.routeId === route.properties.routeId)) {
                        rtData.routes.push(route.properties);
                    }
                }
            }
            
            // Process Internet Gateway
            if (internetGateway && internetGateway.properties) {
                const igwId = internetGateway.properties.internetGatewayId || internetGateway.properties.InternetGatewayId;
                if (!internetGateways.has(igwId)) {
                    internetGateways.set(igwId, {
                        internetGatewayId: igwId,
                        properties: internetGateway.properties
                    });
                    
                    // Link internet gateway to VPC
                    if (vpc && vpc.properties) {
                        const vpcData = vpcs.get(vpc.properties.vpcId);
                        if (vpcData && !vpcData.internetGateways.some((igw: any) => igw.internetGatewayId === igwId)) {
                            vpcData.internetGateways.push(internetGateways.get(igwId));
                        }
                    }
                }
            }
            
            // Process Network ACL
            if (networkAcl && networkAcl.properties) {
                const aclId = networkAcl.properties.networkAclId || networkAcl.properties.NetworkAclId;
                if (!networkAcls.has(aclId)) {
                    networkAcls.set(aclId, {
                        networkAclId: aclId,
                        properties: networkAcl.properties,
                        entries: []
                    });
                    
                    // Link network ACL to VPC
                    if (vpc && vpc.properties) {
                        const vpcData = vpcs.get(vpc.properties.vpcId);
                        if (vpcData && !vpcData.networkAcls.some((acl: any) => acl.networkAclId === aclId)) {
                            vpcData.networkAcls.push(networkAcls.get(aclId));
                        }
                    }
                }
                
                // Add entries to network ACL
                if (networkAclEntry && networkAclEntry.properties) {
                    const aclData = networkAcls.get(aclId);
                    if (aclData && !aclData.entries.some((e: any) => e.entryId === networkAclEntry.properties.entryId)) {
                        aclData.entries.push(networkAclEntry.properties);
                    }
                }
            }
            
            // Process Load Balancer
            if (loadBalancer && loadBalancer.properties) {
                const lbId = loadBalancer.properties.loadBalancerArn || loadBalancer.properties.LoadBalancerArn;
                if (!loadBalancers.has(lbId)) {
                    loadBalancers.set(lbId, {
                        loadBalancerArn: lbId,
                        properties: loadBalancer.properties
                    });
                    
                    // Link load balancer to VPC
                    if (vpc && vpc.properties) {
                        const vpcData = vpcs.get(vpc.properties.vpcId);
                        if (vpcData && !vpcData.loadBalancers.some((lb: any) => lb.loadBalancerArn === lbId)) {
                            vpcData.loadBalancers.push(loadBalancers.get(lbId));
                        }
                    }
                }
            }
        });
        
        // Build the final infrastructure object
        const infrastructure = {
            vpcs: Array.from(vpcs.values()),
            s3Buckets: s3Buckets
        };
        
        res.json(infrastructure);
    } catch (error) {
        console.error('Error fetching infrastructure data:', error);
        res.status(500).json({ error: 'Failed to fetch infrastructure data' });
    } finally {
        await session.close();
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

        // Query to get all VPCs with their subnets, instances, and AMIs
        const result = await session.run(
            `MATCH (v:VPC {userId: $userId, connectionId: $connectionId})
             OPTIONAL MATCH (v)-[:CONTAINS]->(s:Subnet)
             OPTIONAL MATCH (s)-[:BELONGS_TO]->(i:Instance)
             OPTIONAL MATCH (i)-[:USES]->(a:AMI)
             RETURN v, collect(DISTINCT s) as subnets, collect(DISTINCT i) as instances, 
                    collect(DISTINCT a) as amis`,
            { userId, connectionId }
        );

        const infrastructure: TerraformInfrastructure = {
            vpcs: [],
            subnets: [],
            amis: [],
            instances: []
        };

        // Process the results
        result.records.forEach(record => {
            const vpc = record.get('v');
            const subnets = record.get('subnets');
            const instances = record.get('instances');
            const amis = record.get('amis');

            // Process VPC
            if (vpc) {
                infrastructure.vpcs.push({
                    name: vpc.properties.Name || vpc.properties.vpcId,
                    cidr_block: vpc.properties.CidrBlock
                });
            }

            // Process Subnets
            subnets.forEach((subnet: any) => {
                if (subnet) {
                    infrastructure.subnets.push({
                        name: subnet.properties.Name || subnet.properties.subnetId,
                        cidr_block: subnet.properties.CidrBlock,
                        vpc_name: vpc.properties.Name || vpc.properties.vpcId
                    });
                }
            });

            // Process AMIs
            amis.forEach((ami: any) => {
                if (ami) {
                    infrastructure.amis.push({
                        name: ami.properties.Name || ami.properties.imageId,
                        ami_id: ami.properties.imageId,
                        tags: ami.properties.Tags || {}
                    });
                }
            });

            // Process Instances
            instances.forEach((instance: any) => {
                if (instance) {
                    const subnet = subnets.find((s: any) => s.properties.subnetId === instance.properties.subnetId);
                    infrastructure.instances.push({
                        name: instance.properties.Name || instance.properties.instanceId,
                        ami_id: instance.properties.imageId,
                        instance_type: instance.properties.instanceType,
                        subnet_name: subnet ? (subnet.properties.Name || subnet.properties.subnetId) : '',
                        tags: instance.properties.Tags || {}
                    });
                }
            });
        });

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
        
        result.records.forEach(record => {
            const vpc = record.get('v');
            const subnet = record.get('s');
            const instance = record.get('i');
            const securityGroup = record.get('sg');
            const inRule = record.get('inRule');
            const outRule = record.get('outRule');
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
                
                if (inRule) {
                    const ruleData = {
                        ipProtocol: inRule.properties.ipProtocol,
                        fromPort: inRule.properties.fromPort,
                        toPort: inRule.properties.toPort,
                        userIdGroupPairs: inRule.properties.userIdGroupPairs || [],
                        ipRanges: inRule.properties.ipRanges || [],
                        ipv6Ranges: inRule.properties.ipv6Ranges || [],
                        prefixListIds: inRule.properties.prefixListIds || []
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
                
                if (outRule) {
                    const ruleData = {
                        ipProtocol: outRule.properties.ipProtocol,
                        fromPort: outRule.properties.fromPort,
                        toPort: outRule.properties.toPort,
                        userIdGroupPairs: outRule.properties.userIdGroupPairs || [],
                        ipRanges: outRule.properties.ipRanges || [],
                        ipv6Ranges: outRule.properties.ipv6Ranges || [],
                        prefixListIds: outRule.properties.prefixListIds || []
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
                    if (vpcData) {
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
                    if (vpcData) {
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
        
        const buckets = bucketResult.records.map(record => ({
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