import { Request, Response } from 'express';
import { Neo4jService } from '../services/neo4j.service';

export const CloudArchitectureController = {
    /**
     * Get cloud architecture data for a specific user
     */
    async getUserCloudData(req: Request, res: Response): Promise<void> {
        const userId = req.params.userId;
        
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        
        const session = Neo4jService.getSession();
        
        try {
            // Check if user exists and has cloud environment data
            const result = await session.run(
                `
                MATCH (u:User {id: $userId})-[:OWNS]->(e:Environment)
                OPTIONAL MATCH (e)-[:HAS_RESOURCE]->(r)
                RETURN e, collect(r) as resources
                `,
                { userId }
            );
            
            if (result.records.length === 0) {
                res.status(404).json({ error: 'No cloud environment found for this user' });
                return;
            }
            
            // Process Neo4j results into a structured format
            const envNode = result.records[0].get('e');
            const resourceNodes = result.records[0].get('resources');
            
            const environment = {
                id: envNode.identity.toInt(),
                ...envNode.properties,
            };
            
            const resources = resourceNodes.map((resource: any) => {
                if (resource && resource.identity) {
                    return {
                        id: resource.identity.toInt(),
                        ...resource.properties,
                    };
                }
                return null;
            }).filter(Boolean);
            
            // Get network information
            const networkResult = await session.run(
                `
                MATCH (e:Environment {id: $envId})-[:HAS_NETWORK]->(n:Network)
                OPTIONAL MATCH (n)-[:HAS_SUBNET]->(s:Subnet)
                RETURN n as network, collect(s) as subnets
                `,
                { envId: environment.id }
            );
            
            let network = null;
            let subnets = [];
            
            if (networkResult.records.length > 0) {
                const networkNode = networkResult.records[0].get('network');
                const subnetNodes = networkResult.records[0].get('subnets');
                
                network = {
                    ...networkNode.properties,
                };
                
                subnets = subnetNodes.map((subnet: any) => {
                    if (subnet && subnet.identity) {
                        return {
                            ...subnet.properties,
                        };
                    }
                    return null;
                }).filter(Boolean);
                
                network.subnets = subnets;
            }
            
            // Get security information
            const securityResult = await session.run(
                `
                MATCH (e:Environment {id: $envId})-[:HAS_SECURITY]->(s:SecurityConfig)
                RETURN s as security
                `,
                { envId: environment.id }
            );
            
            let security = null;
            
            if (securityResult.records.length > 0) {
                const securityNode = securityResult.records[0].get('security');
                security = {
                    ...securityNode.properties,
                };
            }
            
            // Combine all data into a comprehensive response
            const cloudData = {
                environment,
                resources,
                network,
                security,
            };
            
            res.status(200).json(cloudData);
        } catch (error: any) {
            console.error('Error retrieving cloud architecture data:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        } finally {
            await session.close();
        }
    },
    
    /**
     * Insert sample cloud architecture data for a user
     */
    async insertSampleData(req: Request, res: Response): Promise<void> {
        const userId = req.params.userId;
        
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        
        const session = Neo4jService.getSession();
        
        try {
            // Check if user exists
            const userResult = await session.run(
                'MATCH (u:User {id: $userId}) RETURN u',
                { userId }
            );
            
            if (userResult.records.length === 0) {
                // Create user if not exists
                await session.run(
                    'CREATE (u:User {id: $userId, name: $name, email: $email})',
                    { 
                        userId,
                        name: `Test User ${userId}`,
                        email: `test${userId}@example.com` 
                    }
                );
            }
            
            // Delete existing cloud environment data for the user
            await session.run(
                `
                MATCH (u:User {id: $userId})-[:OWNS]->(e:Environment)
                OPTIONAL MATCH (e)-[r]->(n)
                OPTIONAL MATCH (n)-[r2]->(m)
                DETACH DELETE e, n, m
                `,
                { userId }
            );
            
            // Create sample environment
            const environmentResult = await session.run(
                `
                CREATE (e:Environment {
                    id: randomUUID(),
                    name: 'Production AWS Environment',
                    provider: 'AWS',
                    region: 'us-west-2',
                    created: datetime()
                })
                WITH e
                MATCH (u:User {id: $userId})
                CREATE (u)-[:OWNS]->(e)
                RETURN e
                `,
                { userId }
            );
            
            const envId = environmentResult.records[0].get('e').properties.id;
            
            // Create sample resources
            await session.run(
                `
                MATCH (e:Environment {id: $envId})
                
                // EC2 instances
                CREATE (r1:Resource {
                    id: randomUUID(),
                    type: 'EC2',
                    name: 'Web Server',
                    instanceType: 't2.medium',
                    count: 5,
                    details: 'Running web applications'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r1)
                
                // RDS database
                CREATE (r2:Resource {
                    id: randomUUID(),
                    type: 'RDS',
                    name: 'Main Database',
                    engine: 'MySQL',
                    storage: 100,
                    details: 'Primary database for application data'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r2)
                
                // S3 buckets
                CREATE (r3:Resource {
                    id: randomUUID(),
                    type: 'S3',
                    name: 'Static Assets',
                    count: 2,
                    details: 'Stores static assets and backups'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r3)
                
                // Load Balancer
                CREATE (r4:Resource {
                    id: randomUUID(),
                    type: 'LoadBalancer',
                    name: 'Web Tier ALB',
                    lbType: 'Application',
                    details: 'Distributes traffic to web servers'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r4)
                `,
                { envId }
            );
            
            // Create network configuration
            await session.run(
                `
                MATCH (e:Environment {id: $envId})
                
                CREATE (n:Network {
                    id: randomUUID(),
                    vpcCidr: '10.0.0.0/16',
                    vpcId: 'vpc-' + substring(randomUUID(), 0, 8),
                    region: 'us-west-2'
                })
                CREATE (e)-[:HAS_NETWORK]->(n)
                
                // Public subnets
                CREATE (s1:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.1.0/24',
                    type: 'public',
                    az: 'us-west-2a',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s1)
                
                CREATE (s2:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.2.0/24',
                    type: 'public',
                    az: 'us-west-2b',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s2)
                
                CREATE (s3:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.3.0/24',
                    type: 'public',
                    az: 'us-west-2c',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s3)
                
                // Private subnets
                CREATE (s4:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.4.0/24',
                    type: 'private',
                    az: 'us-west-2a',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s4)
                
                CREATE (s5:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.5.0/24',
                    type: 'private',
                    az: 'us-west-2b',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s5)
                
                CREATE (s6:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.6.0/24',
                    type: 'private',
                    az: 'us-west-2c',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s6)
                `,
                { envId }
            );
            
            // Create security configuration
            await session.run(
                `
                MATCH (e:Environment {id: $envId})
                
                CREATE (s:SecurityConfig {
                    id: randomUUID(),
                    webTierHttps: true,
                    databaseInPrivateSubnet: true,
                    iamLeastPrivilege: true,
                    settings: [
                        'Web tier accessible only through HTTPS',
                        'Database in private subnet',
                        'IAM roles using principle of least privilege'
                    ]
                })
                CREATE (e)-[:HAS_SECURITY]->(s)
                `,
                { envId }
            );
            
            res.status(200).json({ 
                message: 'Sample cloud architecture data inserted successfully',
                userId,
                environment: { id: envId }
            });
            
        } catch (error: any) {
            console.error('Error inserting sample data:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        } finally {
            await session.close();
        }
    },

    /**
     * Insert sample Azure cloud architecture data for a user
     */
    async insertSampleAzureData(req: Request, res: Response): Promise<void> {
        const userId = req.params.userId;
        
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        
        const session = Neo4jService.getSession();
        
        try {
            // Check if user exists
            const userResult = await session.run(
                'MATCH (u:User {id: $userId}) RETURN u',
                { userId }
            );
            
            if (userResult.records.length === 0) {
                // Create user if not exists
                await session.run(
                    'CREATE (u:User {id: $userId, name: $name, email: $email})',
                    { 
                        userId,
                        name: `Test User ${userId}`,
                        email: `test${userId}@example.com` 
                    }
                );
            }
            
            // Delete existing cloud environment data for the user
            await session.run(
                `
                MATCH (u:User {id: $userId})-[:OWNS]->(e:Environment)
                OPTIONAL MATCH (e)-[r]->(n)
                OPTIONAL MATCH (n)-[r2]->(m)
                DETACH DELETE e, n, m
                `,
                { userId }
            );
            
            // Create sample Azure environment
            const environmentResult = await session.run(
                `
                CREATE (e:Environment {
                    id: randomUUID(),
                    name: 'Production Azure Environment',
                    provider: 'Azure',
                    region: 'eastus',
                    created: datetime()
                })
                WITH e
                MATCH (u:User {id: $userId})
                CREATE (u)-[:OWNS]->(e)
                RETURN e
                `,
                { userId }
            );
            
            const envId = environmentResult.records[0].get('e').properties.id;
            
            // Create sample Azure resources
            await session.run(
                `
                MATCH (e:Environment {id: $envId})
                
                // Azure VMs
                CREATE (r1:Resource {
                    id: randomUUID(),
                    type: 'VM',
                    name: 'Web Server',
                    instanceType: 'Standard_D2s_v3',
                    count: 3,
                    details: 'Running web applications on Azure'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r1)
                
                // Azure SQL Database
                CREATE (r2:Resource {
                    id: randomUUID(),
                    type: 'SQL',
                    name: 'Main Database',
                    tier: 'General Purpose',
                    storage: 250,
                    details: 'Primary database for application data'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r2)
                
                // Azure Storage Accounts
                CREATE (r3:Resource {
                    id: randomUUID(),
                    type: 'Storage',
                    name: 'Application Storage',
                    count: 2,
                    replicationType: 'GRS',
                    details: 'Stores static assets and backups'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r3)
                
                // Azure App Gateway
                CREATE (r4:Resource {
                    id: randomUUID(),
                    type: 'AppGateway',
                    name: 'Frontend Gateway',
                    tier: 'WAF_v2',
                    details: 'Application Gateway with WAF'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r4)
                
                // Azure Function App
                CREATE (r5:Resource {
                    id: randomUUID(),
                    type: 'Function',
                    name: 'Background Processor',
                    plan: 'Premium',
                    details: 'Serverless functions for background processing'
                })
                CREATE (e)-[:HAS_RESOURCE]->(r5)
                `,
                { envId }
            );
            
            // Create network configuration
            await session.run(
                `
                MATCH (e:Environment {id: $envId})
                
                CREATE (n:Network {
                    id: randomUUID(),
                    vnetCidr: '10.0.0.0/16',
                    vnetName: 'production-vnet',
                    region: 'eastus'
                })
                CREATE (e)-[:HAS_NETWORK]->(n)
                
                // Public subnets
                CREATE (s1:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.1.0/24',
                    type: 'public',
                    name: 'gateway-subnet',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s1)
                
                CREATE (s2:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.2.0/24',
                    type: 'public',
                    name: 'bastion-subnet',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s2)
                
                // Private subnets
                CREATE (s3:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.3.0/24',
                    type: 'private',
                    name: 'web-subnet',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s3)
                
                CREATE (s4:Subnet {
                    id: randomUUID(),
                    cidr: '10.0.4.0/24',
                    type: 'private',
                    name: 'data-subnet',
                    subnetId: 'subnet-' + substring(randomUUID(), 0, 8)
                })
                CREATE (n)-[:HAS_SUBNET]->(s4)
                `,
                { envId }
            );
            
            // Create security configuration
            await session.run(
                `
                MATCH (e:Environment {id: $envId})
                
                CREATE (s:SecurityConfig {
                    id: randomUUID(),
                    webTierHttps: true,
                    privateEndpoints: true,
                    roleBasedAccess: true,
                    settings: [
                        'All traffic through Azure Application Gateway with WAF',
                        'Private endpoints for database and storage',
                        'Role-based access control (RBAC) across all services',
                        'Network security groups limiting traffic between subnets',
                        'Key Vault integration for secrets management'
                    ]
                })
                CREATE (e)-[:HAS_SECURITY]->(s)
                `,
                { envId }
            );
            
            res.status(200).json({ 
                message: 'Sample Azure cloud architecture data inserted successfully',
                userId,
                environment: { id: envId }
            });
            
        } catch (error: any) {
            console.error('Error inserting sample Azure data:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        } finally {
            await session.close();
        }
    }
}; 