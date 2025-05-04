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
    const { connectionId, userId } = req.params;

    if (!userId || !connectionId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = Neo4jService.getSession();
    try {
        const result = await session.executeRead(tx =>
            tx.run(
                `MATCH (v:VPC {userId: $userId, connectionId: $connectionId})
                 OPTIONAL MATCH (v)-[:CONTAINS]->(s:Subnet)
                 OPTIONAL MATCH (s)-[:BELONGS_TO]->(i:Instance)
                 OPTIONAL MATCH (v)-[:HAS]->(sg:SecurityGroup)
                 OPTIONAL MATCH (b:Bucket {userId: $userId, connectionId: $connectionId})
                 RETURN v, 
                        collect(DISTINCT s) as subnets,
                        collect(DISTINCT i) as instances,
                        collect(DISTINCT sg) as securityGroups,
                        collect(DISTINCT b) as buckets`,
                { userId, connectionId }
            )
        );

        const infrastructure: CloudInfrastructure = {
            vpcs: result.records.map(record => ({
                vpcId: record.get('v').properties.vpcId,
                properties: record.get('v').properties,
                subnets: record.get('subnets').map((subnet: any) => ({
                    subnetId: subnet.properties.subnetId,
                    properties: subnet.properties,
                    instances: record.get('instances')
                        .filter((instance: any) => instance.properties.subnetId === subnet.properties.subnetId)
                        .map((instance: any) => ({
                            instanceId: instance.properties.instanceId,
                            properties: instance.properties
                        }))
                })),
                securityGroups: record.get('securityGroups').map((sg: any) => ({
                    groupId: sg.properties.groupId,
                    properties: sg.properties
                }))
            })),
            s3Buckets: result.records[0].get('buckets').map((bucket: any) => ({
                name: bucket.properties.name,
                properties: bucket.properties
            }))
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
    const { userId, connectionId } = req.params;

    if (!userId || !connectionId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`Fetching infrastructure data for userId: ${userId}, connectionId: ${connectionId}`);
    
    const session = Neo4jService.getSession();
    try {
        // Use simplified query that just finds any nodes with matching userId and connectionId
        const result = await session.run(
            `MATCH (n)
             WHERE n.userId = $userId AND n.connectionId = $connectionId
             RETURN collect(n) as resources`,
            { userId, connectionId }
        );

        if (result.records.length === 0 || result.records[0].get('resources').length === 0) {
            console.log(`No resources found for userId: ${userId}, connectionId: ${connectionId}`);
            return res.status(404).json({ error: 'No resources found for this user and connection' });
        }

        const resourceNodes = result.records[0].get('resources');
        console.log(`Found ${resourceNodes.length} resources`);
        
        // Debug log of all resource types
        const nodeTypes = new Set();
        resourceNodes.forEach((node: any) => {
            if (node.labels && node.labels.length > 0) {
                nodeTypes.add(node.labels[0]);
            }
        });
        console.log(`Resource types found: ${Array.from(nodeTypes).join(', ')}`);
        
        // Find VPC nodes
        const vpcNodes = resourceNodes.filter((node: any) => 
            node.labels && node.labels.includes('VPC')
        );
        console.log(`Found ${vpcNodes.length} VPC nodes`);
        
        // Log VPC node properties
        vpcNodes.forEach((vpc: any, index: number) => {
            console.log(`VPC ${index + 1} properties:`, vpc.properties);
        });
        
        // Find subnet nodes
        const subnetNodes = resourceNodes.filter((node: any) => 
            node.labels && node.labels.includes('Subnet')
        );
        console.log(`Found ${subnetNodes.length} subnet nodes`);
        
        // Log subnet node properties
        subnetNodes.forEach((subnet: any, index: number) => {
            console.log(`Subnet ${index + 1} properties:`, subnet.properties);
        });
        
        // Find instance nodes
        const instanceNodes = resourceNodes.filter((node: any) => 
            node.labels && node.labels.includes('Instance')
        );
        console.log(`Found ${instanceNodes.length} instance nodes`);
        
        // Find security group nodes
        const sgNodes = resourceNodes.filter((node: any) => 
            node.labels && node.labels.includes('SecurityGroup')
        );
        console.log(`Found ${sgNodes.length} security group nodes`);
        
        // Find bucket nodes
        const bucketNodes = resourceNodes.filter((node: any) => 
            node.labels && node.labels.includes('Bucket')
        );
        console.log(`Found ${bucketNodes.length} bucket nodes`);

        // Construct infrastructure object with fallbacks for missing properties
        const infrastructure: CloudInfrastructure = {
            vpcs: vpcNodes.map((vpc: any) => {
                const vpcId = vpc.properties.vpcId || vpc.properties.VpcId || `vpc-${Math.random().toString(36).substring(2, 8)}`;
                return {
                    vpcId,
                    properties: vpc.properties,
                    subnets: subnetNodes
                        .filter((subnet: any) => {
                            const subnetVpcId = subnet.properties.vpcId || subnet.properties.VpcId;
                            // If subnet doesn't have vpcId, include it in the first VPC or skip if we're filtering
                            return subnetVpcId ? subnetVpcId === vpcId : vpcNodes.indexOf(vpc) === 0;
                        })
                        .map((subnet: any) => {
                            const subnetId = subnet.properties.subnetId || subnet.properties.SubnetId || `subnet-${Math.random().toString(36).substring(2, 8)}`;
                            return {
                                subnetId,
                                properties: subnet.properties,
                                instances: instanceNodes
                                    .filter((instance: any) => {
                                        const instanceSubnetId = instance.properties.subnetId || instance.properties.SubnetId;
                                        // If instance doesn't have subnetId, include it in the first subnet or skip
                                        return instanceSubnetId ? instanceSubnetId === subnetId : subnetNodes.indexOf(subnet) === 0;
                                    })
                                    .map((instance: any) => ({
                                        instanceId: instance.properties.instanceId || instance.properties.InstanceId || `i-${Math.random().toString(36).substring(2, 8)}`,
                                        properties: instance.properties
                                    }))
                            };
                        }),
                    securityGroups: sgNodes
                        .filter((sg: any) => {
                            const sgVpcId = sg.properties.vpcId || sg.properties.VpcId;
                            // If sg doesn't have vpcId, include it in the first VPC or skip
                            return sgVpcId ? sgVpcId === vpcId : vpcNodes.indexOf(vpc) === 0;
                        })
                        .map((sg: any) => ({
                            groupId: sg.properties.groupId || sg.properties.GroupId || `sg-${Math.random().toString(36).substring(2, 8)}`,
                            properties: sg.properties
                        }))
                };
            }),
            s3Buckets: bucketNodes.map((bucket: any) => ({
                name: bucket.properties.name || bucket.properties.Name || `bucket-${Math.random().toString(36).substring(2, 8)}`,
                properties: bucket.properties
            }))
        };

        // Log the final structure
        console.log(`Returning infrastructure with ${infrastructure.vpcs.length} VPCs and ${infrastructure.s3Buckets.length} buckets`);
        
        res.json(infrastructure);
    } catch (error: any) {
        console.error('Error fetching infrastructure data:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        res.status(500).json({ error: 'Failed to fetch infrastructure data' });
    } finally {
        await session.close();
    }
}; 