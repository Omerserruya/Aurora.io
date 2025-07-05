import { Request, Response } from 'express';
import { Neo4jService } from '../services/neo4j.service';

export const getResourceMetrics = async (req: Request, res: Response) => {
    let session = null;
    
    try {
        const { userId, connectionId } = req.query;

        if (!userId || !connectionId) {
            return res.status(400).json({ error: 'Missing required fields: userId and connectionId' });
        }

        session = Neo4jService.getSession();

        // Get compute resources (EC2 instances)
        const computeResult = await session.run(
            `MATCH (i:Instance)
             WHERE i.userId = $userId AND i.connectionId = $connectionId
             RETURN count(i) as count`,
            { userId, connectionId }
        );

        // Get storage resources (S3 buckets)
        const storageResult = await session.run(
            `MATCH (s:Bucket)
             WHERE s.userId = $userId AND s.connectionId = $connectionId
             RETURN count(s) as count`,
            { userId, connectionId }
        );

        // Get network resources (VPCs, Subnets, Security Groups)
        const networkResult = await session.run(
            `MATCH (n)
             WHERE (n:VPC OR n:Subnet OR n:SecurityGroup)
             AND n.userId = $userId AND n.connectionId = $connectionId
             RETURN count(n) as count`,
            { userId, connectionId }
        );

        // Get database resources (RDS instances)
        const databaseResult = await session.run(
            `MATCH (d:Database)
             WHERE d.userId = $userId AND d.connectionId = $connectionId
             RETURN count(d) as count`,
            { userId, connectionId }
        );

        const metrics = {
            compute: computeResult.records[0].get('count').toNumber() || 0,
            storage: storageResult.records[0].get('count').toNumber() || 0,
            network: networkResult.records[0].get('count').toNumber() || 0,
            database: databaseResult.records[0].get('count').toNumber() || 0
        };

        res.json(metrics);
    } catch (error) {
        console.error('Error fetching resource metrics:', error);
        res.status(500).json({ error: 'Failed to fetch resource metrics' });
    } finally {
        if (session) {
            await session.close();
        }
    }
};

export const getResourceDetails = async (req: Request, res: Response) => {
    let session = null;
    
    try {
        const { userId, connectionId, resourceType } = req.query;

        if (!userId || !connectionId || !resourceType) {
            return res.status(400).json({ error: 'Missing required fields: userId, connectionId, and resourceType' });
        }

        session = Neo4jService.getSession();

        let query = '';
        switch (resourceType) {
            case 'compute':
                query = `
                    MATCH (v:VPC)
                    WHERE v.userId = $userId AND v.connectionId = $connectionId
                    OPTIONAL MATCH (v)-[:CONTAINS]->(s:Subnet)
                    OPTIONAL MATCH (i:Instance)-[:BELONGS_TO]->(s)
                    OPTIONAL MATCH (i)-[:HAS_TAG]->(t:Tag)
                    WITH v, s, i, collect(t) as tags
                    RETURN i, s, v, tags
                    ORDER BY v.vpcId, i.instanceId`;
                break;
            case 'storage':
                query = `
                    MATCH (b:Bucket)
                    WHERE b.userId = $userId AND b.connectionId = $connectionId
                    OPTIONAL MATCH (b)-[:HAS_TAG]->(t:Tag)
                    WITH b, collect(t) as tags
                    RETURN b, tags
                    ORDER BY b.name`;
                break;
            case 'network':
                query = `
                    MATCH (n)
                    WHERE (n:VPC OR n:Subnet OR n:SecurityGroup)
                    AND n.userId = $userId AND n.connectionId = $connectionId
                    OPTIONAL MATCH (v:VPC)-[:CONTAINS]->(n)
                    OPTIONAL MATCH (n)-[:HAS_TAG]->(t:Tag)
                    WITH n, v, collect(t) as tags
                    RETURN n, v, tags
                    ORDER BY n.name, n.vpcId, n.subnetId, n.groupId`;
                break;
            case 'database':
                query = `
                    MATCH (v:VPC)
                    WHERE v.userId = $userId AND v.connectionId = $connectionId
                    OPTIONAL MATCH (v)-[:CONTAINS]->(s:Subnet)
                    OPTIONAL MATCH (d:Database)-[:BELONGS_TO]->(s)
                    OPTIONAL MATCH (d)-[:HAS_TAG]->(t:Tag)
                    WITH v, s, d, collect(t) as tags
                    RETURN d, s, v, tags
                    ORDER BY v.vpcId, d.name`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid resource type' });
        }

        const result = await session.run(query, { userId, connectionId });
        
        // Group resources by VPC or other relevant grouping
        const groupedResources: { [key: string]: any[] } = {};
        
        result.records.forEach((record: any) => {
            let resource: any = {};
            let groupKey = 'default';

            switch (resourceType) {
                case 'compute': {
                    const instance = record.get(0);
                    const subnet = record.get(1);
                    const vpc = record.get(2);
                    const tags = record.get(3) || [];
                    
                    if (instance) {
                        resource = {
                            ...instance.properties,
                            type: instance.labels[0],
                            subnet: subnet ? subnet.properties : null,
                            vpc: vpc ? vpc.properties : null,
                            tags: tags.map((tag: any) => tag.properties)
                        };
                        groupKey = vpc ? vpc.properties.vpcId : 'No VPC';
                    }
                    break;
                }

                case 'storage': {
                    const bucket = record.get(0);
                    const bucketTags = record.get(1) || [];
                    
                    if (bucket) {
                        resource = {
                            ...bucket.properties,
                            type: bucket.labels[0],
                            tags: bucketTags.map((tag: any) => tag.properties)
                        };
                        groupKey = 'Storage Resources';
                    }
                    break;
                }

                case 'network': {
                    const network = record.get(0);
                    const networkVpc = record.get(1);
                    const networkTags = record.get(2) || [];
                    
                    if (network) {
                        resource = {
                            ...network.properties,
                            type: network.labels[0],
                            vpc: networkVpc ? networkVpc.properties : null,
                            tags: networkTags.map((tag: any) => tag.properties)
                        };
                        if (network.labels[0] === 'VPC') {
                            groupKey = resource.vpcId || 'No VPC ID';
                        } else if (networkVpc) {
                            groupKey = networkVpc.properties.vpcId;
                        } else if (resource.vpcId) {
                            groupKey = resource.vpcId;
                        } else {
                            groupKey = 'No VPC';
                        }
                    }
                    break;
                }

                case 'database': {
                    const database = record.get(0);
                    const dbSubnet = record.get(1);
                    const dbVpc = record.get(2);
                    const dbTags = record.get(3) || [];
                    
                    if (database) {
                        resource = {
                            ...database.properties,
                            type: database.labels[0],
                            subnet: dbSubnet ? dbSubnet.properties : null,
                            vpc: dbVpc ? dbVpc.properties : null,
                            tags: dbTags.map((tag: any) => tag.properties)
                        };
                        groupKey = dbVpc ? dbVpc.properties.vpcId : 'No VPC';
                    }
                    break;
                }
            }

            if (Object.keys(resource).length > 0 && !groupedResources[groupKey]) {
                groupedResources[groupKey] = [];
            }
            if (Object.keys(resource).length > 0) {
                groupedResources[groupKey].push(resource);
            }
        });

        // Convert grouped resources to array format
        const formattedResources = Object.entries(groupedResources).map(([groupKey, resources]) => ({
            groupKey,
            resources
        }));

        res.json(formattedResources);
    } catch (error) {
        console.error('Error fetching resource details:', error);
        res.status(500).json({ error: 'Failed to fetch resource details' });
    } finally {
        if (session) {
            await session.close();
        }
    }
}; 