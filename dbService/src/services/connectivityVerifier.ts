// Types for AWS resources
export interface AWSResource {
    id: string;
    type: 'EC2' | 'S3' | 'ALB' | 'IGW' | 'VPC' | 'Subnet';
    vpcId?: string | null;
    subnetId?: string | null;
    cidrBlock?: string;
    securityGroupIds: string[];
    properties: Record<string, any>;
}

export interface VerificationResult {
    allowed: boolean;
    reason: string;
}

export interface SecurityGroupRule {
    protocol: string;
    fromPort?: number;
    toPort?: number;
    cidrBlocks?: string[];
    securityGroupIds?: string[];
    description?: string;
}

export interface SecurityGroup {
    groupId: string;
    inboundRules: SecurityGroupRule[];
    outboundRules: SecurityGroupRule[];
}

export interface NetworkAclEntry {
    ruleNumber: number;
    protocol: string;
    ruleAction: 'allow' | 'deny';
    egress: boolean;
    cidrBlock: string;
    fromPort?: number;
    toPort?: number;
}

export interface NetworkAcl {
    networkAclId: string;
    entries: NetworkAclEntry[];
    subnetId: string;
}

export interface Route {
    destinationCidrBlock: string;
    target: {
        type: 'local' | 'internetGateway' | 'vpcPeering';
        id: string;
    };
    state: 'active' | 'blackhole';
}

export interface RouteTable {
    routeTableId: string;
    routes: Route[];
    subnetAssociations: string[];
}

// Base verification strategy
abstract class BaseVerificationStrategy {
    protected data: CloudQueryResult['data'];
    
    constructor(data: CloudQueryResult['data']) {
        this.data = data;
    }
    
    abstract verify(source: AWSResource, target: AWSResource): Promise<VerificationResult>;
    
    protected checkProtocolAndPort(rule: any, protocol: string, port: number): boolean {
        if (rule.protocol !== '-1' && rule.protocol !== protocol) return false;
        if (rule.fromPort && rule.toPort) {
            if (port < rule.fromPort || port > rule.toPort) return false;
        }
        return true;
    }

    protected async isCidrCovered(sourceCidr: string, targetCidr: string): Promise<boolean> {
        try {
            // Parse CIDR notation
            const [sourceIp, sourceBits] = sourceCidr.split('/');
            const [targetIp, targetBits] = targetCidr.split('/');
            
            // Convert IP addresses to numbers
            const sourceNum = this.ipToNumber(sourceIp);
            const targetNum = this.ipToNumber(targetIp);
            
            // Calculate network masks
            const sourceMask = this.getNetworkMask(parseInt(sourceBits));
            const targetMask = this.getNetworkMask(parseInt(targetBits));
            
            // Calculate network addresses
            const sourceNetwork = sourceNum & sourceMask;
            const targetNetwork = targetNum & targetMask;
            
            // Calculate broadcast addresses
            const sourceBroadcast = sourceNetwork | ~sourceMask >>> 0;
            const targetBroadcast = targetNetwork | ~targetMask >>> 0;
            
            // Check if source range is within target range
            return sourceNetwork >= targetNetwork && sourceBroadcast <= targetBroadcast;
        } catch (error: unknown) {
            console.error('Error checking CIDR coverage:', error);
            return false;
        }
    }

    private ipToNumber(ip: string): number {
        return ip.split('.')
            .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    }

    private getNetworkMask(bits: number): number {
        return ~((1 << (32 - bits)) - 1) >>> 0;
    }
}

// Security Group verification strategy
class SecurityGroupStrategy extends BaseVerificationStrategy {
    async verify(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // For EC2 to IGW
        if (source.type === 'EC2' && target.type === 'IGW') {
            return this.verifyEc2ToIgw(source);
        }

        // For ALB to IGW
        if (source.type === 'ALB' && target.type === 'IGW') {
            return this.verifyAlbToIgw(source, target);
        }

        // For ALB to EC2
        if (source.type === 'ALB' && target.type === 'EC2') {
            return this.verifyAlbToEc2(source, target);
        }

        // For EC2 to EC2
        if (source.type === 'EC2' && target.type === 'EC2') {
            return this.verifyEc2ToEc2(source, target);
        }

        return { allowed: false, reason: 'Unsupported resource combination' };
    }

    private async verifyEc2ToIgw(source: AWSResource): Promise<VerificationResult> {
        if (!source.securityGroupIds?.length) {
            return { allowed: true, reason: 'EC2 has no security groups, allowing traffic by default' };
        }

        const ec2OutboundAllowed = source.securityGroupIds.some(sgId => {
            const sg = this.data.security_groups?.find(s => s.GroupId === sgId);
            if (!sg) return false;

            return sg.OutboundRules?.some(rule => {
                if (!this.checkProtocolAndPort(rule, 'tcp', 80)) return false;
                return rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0');
            });
        });

        return ec2OutboundAllowed 
            ? { allowed: true, reason: 'Security group rules allow EC2 to IGW traffic' }
            : { allowed: false, reason: 'EC2 security group blocks outbound traffic to IGW' };
    }

    private async verifyAlbToIgw(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // Check ALB outbound rules
        if (!source.securityGroupIds?.length) {
            return { allowed: true, reason: 'ALB has no security groups, allowing traffic by default' };
        }

        const albOutboundAllowed = source.securityGroupIds.some(sgId => {
            const sg = this.data.security_groups?.find(s => s.GroupId === sgId);
            if (!sg) return false;

            return sg.OutboundRules?.some(rule => {
                if (!this.checkProtocolAndPort(rule, 'tcp', 80)) return false;
                return rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0');
            });
        });

        return albOutboundAllowed 
            ? { allowed: true, reason: 'Security group rules allow ALB to IGW traffic' }
            : { allowed: false, reason: 'ALB security group blocks outbound traffic to IGW' };
    }

    private async verifyAlbToEc2(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // Check ALB outbound rules
        if (!source.securityGroupIds?.length) {
            return { allowed: true, reason: 'ALB has no security groups, allowing traffic by default' };
        }

        const albOutboundAllowed = source.securityGroupIds.some(sgId => {
            const sg = this.data.security_groups?.find(s => s.GroupId === sgId);
            if (!sg) return false;

            return sg.OutboundRules?.some(rule => {
                if (!this.checkProtocolAndPort(rule, 'tcp', 80)) return false;
                return rule.IpRanges?.some(range => 
                    range.CidrIp === '0.0.0.0/0' || 
                    (target.cidrBlock && this.isCidrCovered(range.CidrIp, target.cidrBlock))
                ) || rule.UserIdGroupPairs?.some(pair => 
                    target.securityGroupIds?.includes(pair.GroupId)
                );
            });
        });

        if (!albOutboundAllowed) {
            return { allowed: false, reason: 'ALB security group blocks outbound traffic' };
        }

        // Check EC2 inbound rules
        if (!target.securityGroupIds?.length) {
            return { allowed: true, reason: 'EC2 has no security groups, allowing traffic by default' };
        }

        const ec2InboundAllowed = target.securityGroupIds.some(sgId => {
            const sg = this.data.security_groups?.find(s => s.GroupId === sgId);
            if (!sg) return false;

            return sg.InboundRules?.some(rule => {
                if (!this.checkProtocolAndPort(rule, 'tcp', 80)) return false;
                return rule.IpRanges?.some(range => 
                    range.CidrIp === '0.0.0.0/0' || 
                    (source.cidrBlock && this.isCidrCovered(range.CidrIp, source.cidrBlock))
                ) || rule.UserIdGroupPairs?.some(pair => 
                    source.securityGroupIds?.includes(pair.GroupId)
                );
            });
        });

        return ec2InboundAllowed 
            ? { allowed: true, reason: 'Security group rules allow ALB to EC2 traffic' }
            : { allowed: false, reason: 'EC2 security group blocks inbound traffic from ALB' };
    }

    private async verifyEc2ToEc2(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // Check source outbound rules
        const sourceOutboundAllowed = source.securityGroupIds?.some(sgId => {
            const sg = this.data.security_groups?.find(s => s.GroupId === sgId);
            if (!sg) return false;

            return sg.OutboundRules?.some(rule => {
                if (!this.checkProtocolAndPort(rule, 'tcp', 80)) return false;
                return rule.IpRanges?.some(range => 
                    range.CidrIp === '0.0.0.0/0' || 
                    (target.cidrBlock && this.isCidrCovered(range.CidrIp, target.cidrBlock))
                ) || rule.UserIdGroupPairs?.some(pair => 
                    target.securityGroupIds?.includes(pair.GroupId)
                );
            });
        });

        if (!sourceOutboundAllowed) {
            return { allowed: false, reason: 'Source EC2 security group blocks outbound traffic' };
        }

        // Check target inbound rules
        const targetInboundAllowed = target.securityGroupIds?.some(sgId => {
            const sg = this.data.security_groups?.find(s => s.GroupId === sgId);
            if (!sg) return false;

            return sg.InboundRules?.some(rule => {
                if (!this.checkProtocolAndPort(rule, 'tcp', 80)) return false;
                return rule.IpRanges?.some(range => 
                    range.CidrIp === '0.0.0.0/0' || 
                    (source.cidrBlock && this.isCidrCovered(range.CidrIp, source.cidrBlock))
                ) || rule.UserIdGroupPairs?.some(pair => 
                    source.securityGroupIds?.includes(pair.GroupId)
                );
            });
        });

        return targetInboundAllowed 
            ? { allowed: true, reason: 'Security group rules allow EC2 to EC2 traffic' }
            : { allowed: false, reason: 'Target EC2 security group blocks inbound traffic' };
    }
}

// Network ACL verification strategy
class NetworkAclStrategy extends BaseVerificationStrategy {
    async verify(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // For EC2 to S3
        if (source.type === 'EC2' && target.type === 'S3') {
            return this.verifyEc2ToS3(source);
        }

        // For EC2 to IGW
        if (source.type === 'EC2' && target.type === 'IGW') {
            return this.verifyEc2ToIgw(source);
        }

        // For ALB to EC2
        if (source.type === 'ALB' && target.type === 'EC2') {
            return this.verifyAlbToEc2(source, target);
        }

        // For EC2 to EC2
        if (source.type === 'EC2' && target.type === 'EC2') {
            return this.verifyEc2ToEc2(source, target);
        }

        return { allowed: false, reason: 'Unsupported resource combination' };
    }

    private async verifyEc2ToS3(source: AWSResource): Promise<VerificationResult> {
        // Check if EC2 has internet access through IGW
        const sourceSubnet = this.data.subnets?.find(s => s.SubnetId === source.subnetId);
        if (!sourceSubnet) {
            return { allowed: false, reason: 'EC2 subnet not found' };
        }

        const sourceVpc = sourceSubnet.VpcId;
        if (!sourceVpc) {
            return { allowed: false, reason: 'EC2 VPC not found' };
        }

        // Check if there's an IGW attached to the VPC
        const igw = this.data.internet_gateways?.find(igw => 
            igw.Attachments?.some(att => 
                att.VpcId === sourceVpc && 
                (att.State === 'attached' || att.State === 'available')
            )
        );

        if (!igw) {
            return { allowed: false, reason: 'No Internet Gateway attached to VPC' };
        }

        // Check route table for internet access
        const routeTable = this.data.route_tables?.find(rt =>
            rt.Associations?.some(a => a.SubnetId === source.subnetId)
        );

        if (!routeTable) {
            return { allowed: false, reason: 'No route table found for EC2 subnet' };
        }

        const igwRoute = routeTable.Routes?.find(r => 
            r.State === 'active' && 
            r.DestinationCidrBlock === '0.0.0.0/0' &&
            r.GatewayId === igw.InternetGatewayId
        );

        if (!igwRoute) {
            return { allowed: false, reason: 'No Internet Gateway route found' };
        }

        // Check security groups for outbound access
        if (!source.securityGroupIds?.length) {
            return { allowed: true, reason: 'EC2 has no security groups, allowing traffic by default' };
        }

        const ec2OutboundAllowed = source.securityGroupIds.some(sgId => {
            const sg = this.data.security_groups?.find(s => s.GroupId === sgId);
            if (!sg) return false;

            return sg.OutboundRules?.some(rule => {
                if (!this.checkProtocolAndPort(rule, 'tcp', 443)) return false;
                return rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0');
            });
        });

        return ec2OutboundAllowed 
            ? { allowed: true, reason: 'Security group rules allow EC2 to S3 traffic' }
            : { allowed: false, reason: 'EC2 security group blocks outbound traffic to S3' };
    }

    private async verifyEc2ToIgw(source: AWSResource): Promise<VerificationResult> {
        if (!source.subnetId) {
            return { allowed: true, reason: 'Not applicable' };
        }

        const sourceNacl = this.data.network_acls?.find(nacl =>
            nacl.Associations?.some(a => a.SubnetId === source.subnetId)
        );

        if (sourceNacl) {
            const outboundAllowed = await this.verifyNaclRules(sourceNacl, true);
            if (!outboundAllowed) {
                return { allowed: false, reason: 'Source subnet NACL blocks outbound traffic to IGW' };
            }
        }

        return { allowed: true, reason: 'Network ACLs allow EC2 to IGW traffic' };
    }

    private async verifyToS3(source: AWSResource): Promise<VerificationResult> {
        if (!source.subnetId) {
            return { allowed: true, reason: 'Not applicable' };
        }

        const sourceNacl = this.data.network_acls?.find(nacl =>
            nacl.Associations?.some(a => a.SubnetId === source.subnetId)
        );

        if (sourceNacl) {
            const outboundAllowed = await this.verifyNaclRules(sourceNacl, true);
            if (!outboundAllowed) {
                return { allowed: false, reason: 'Source NACL blocks outbound traffic to S3' };
            }
        }

        return { allowed: true, reason: 'Network ACLs allow traffic to S3' };
    }

    private async verifyAlbToEc2(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // Check ALB subnet's NACL
        if (source.subnetId) {
            const albNacl = this.data.network_acls?.find(nacl =>
                nacl.Associations?.some(a => a.SubnetId === source.subnetId)
            );

            if (albNacl) {
                const outboundAllowed = await this.verifyNaclRules(albNacl, true);
                if (!outboundAllowed) {
                    return { allowed: false, reason: 'ALB subnet NACL blocks outbound traffic' };
                }
            }
        }

        // Check EC2 subnet's NACL
        if (target.subnetId) {
            const ec2Nacl = this.data.network_acls?.find(nacl =>
                nacl.Associations?.some(a => a.SubnetId === target.subnetId)
            );

            if (ec2Nacl) {
                const inboundAllowed = await this.verifyNaclRules(ec2Nacl, false);
                if (!inboundAllowed) {
                    return { allowed: false, reason: 'EC2 subnet NACL blocks inbound traffic' };
                }
            }
        }

        return { allowed: true, reason: 'Network ACLs allow ALB to EC2 traffic' };
    }

    private async verifyEc2ToEc2(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // Check source subnet's NACL
        if (source.subnetId) {
            const sourceNacl = this.data.network_acls?.find(nacl =>
                nacl.Associations?.some(a => a.SubnetId === source.subnetId)
            );

            if (sourceNacl) {
                const outboundAllowed = await this.verifyNaclRules(sourceNacl, true);
                if (!outboundAllowed) {
                    return { allowed: false, reason: 'Source subnet NACL blocks outbound traffic' };
                }
            }
        }

        // Check target subnet's NACL
        if (target.subnetId) {
            const targetNacl = this.data.network_acls?.find(nacl =>
                nacl.Associations?.some(a => a.SubnetId === target.subnetId)
            );

            if (targetNacl) {
                const inboundAllowed = await this.verifyNaclRules(targetNacl, false);
                if (!inboundAllowed) {
                    return { allowed: false, reason: 'Target subnet NACL blocks inbound traffic' };
                }
            }
        }

        return { allowed: true, reason: 'Network ACLs allow EC2 to EC2 traffic' };
    }

    private async verifyNaclRules(nacl: any, isEgress: boolean): Promise<boolean> {
        const rules = nacl.Entries?.filter((e: any) => e.Egress === isEgress) || [];
        rules.sort((a: any, b: any) => a.RuleNumber - b.RuleNumber);

        for (const rule of rules) {
            if (!this.checkProtocolAndPort(rule, 'tcp', 80)) continue;

            const isCovered = await this.isCidrCovered(rule.CidrBlock, '0.0.0.0/0');
            if (isCovered) {
                return rule.RuleAction === 'allow';
            }
        }

        return false; // Default deny
    }
}

// Route Table verification strategy
class RouteTableStrategy extends BaseVerificationStrategy {
    async verify(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        // For EC2 to IGW
        if (source.type === 'EC2' && target.type === 'IGW') {
            return this.verifyEc2ToIgw(source, target);
        }

        // For ALB to IGW
        if (source.type === 'ALB' && target.type === 'IGW') {
            return this.verifyAlbToIgw(source, target);
        }

        // For ALB to EC2
        if (source.type === 'ALB' && target.type === 'EC2') {
            return this.verifyAlbToEc2(source, target);
        }

        // For EC2 to EC2
        if (source.type === 'EC2' && target.type === 'EC2') {
            return this.verifyEc2ToEc2(source, target);
        }

        return { allowed: false, reason: 'Unsupported resource combination' };
    }

    private async verifyEc2ToIgw(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        const sourceSubnet = this.data.subnets?.find(s => s.SubnetId === source.subnetId);
        if (!sourceSubnet) {
            return { allowed: false, reason: 'EC2 subnet not found' };
        }

        const sourceVpc = sourceSubnet.VpcId;
        if (!sourceVpc) {
            return { allowed: false, reason: 'EC2 VPC not found' };
        }

        const igw = this.data.internet_gateways?.find(igw => 
            igw.InternetGatewayId === target.id &&
            igw.Attachments?.some(att => 
                att.VpcId === sourceVpc && 
                (att.State === 'attached' || att.State === 'available')
            )
        );

        if (!igw) {
            return { allowed: false, reason: 'Internet Gateway not attached to VPC' };
        }

        const routeTable = this.data.route_tables?.find(rt =>
            rt.Associations?.some(a => a.SubnetId === source.subnetId)
        );

        if (!routeTable) {
            return { allowed: false, reason: 'No route table found for EC2 subnet' };
        }

        const igwRoute = routeTable.Routes?.find(r => 
            r.State === 'active' && 
            r.DestinationCidrBlock === '0.0.0.0/0' &&
            r.GatewayId === igw.InternetGatewayId
        );

        if (!igwRoute) {
            return { allowed: false, reason: 'No Internet Gateway route found' };
        }

        return { allowed: true, reason: 'Internet Gateway route exists' };
    }

    private async verifyAlbToIgw(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        const sourceSubnet = this.data.subnets?.find(s => s.SubnetId === source.subnetId);
        if (!sourceSubnet) {
            return { allowed: false, reason: 'ALB subnet not found' };
        }

        const sourceVpc = sourceSubnet.VpcId;
        if (!sourceVpc) {
            return { allowed: false, reason: 'ALB VPC not found' };
        }

        const igw = this.data.internet_gateways?.find(igw => 
            igw.InternetGatewayId === target.id &&
            igw.Attachments?.some(att => 
                att.VpcId === sourceVpc && 
                (att.State === 'attached' || att.State === 'available')
            )
        );

        if (!igw) {
            return { allowed: false, reason: 'Internet Gateway not attached to VPC' };
        }

        const routeTable = this.data.route_tables?.find(rt =>
            rt.Associations?.some(a => a.SubnetId === source.subnetId)
        );

        if (!routeTable) {
            return { allowed: false, reason: 'No route table found for ALB subnet' };
        }

        const igwRoute = routeTable.Routes?.find(r => 
            r.State === 'active' && 
            r.DestinationCidrBlock === '0.0.0.0/0' &&
            r.GatewayId === igw.InternetGatewayId
        );

        if (!igwRoute) {
            return { allowed: false, reason: 'No Internet Gateway route found' };
        }

        return { allowed: true, reason: 'Internet Gateway route exists' };
    }

    private async verifyAlbToEc2(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        const targetSubnet = this.data.subnets?.find(s => s.SubnetId === target.subnetId);
        if (!targetSubnet) {
            return { allowed: false, reason: 'EC2 subnet not found' };
        }

        const targetVpc = targetSubnet.VpcId;
        if (!targetVpc) {
            return { allowed: false, reason: 'EC2 VPC not found' };
        }

        if (source.vpcId !== targetVpc) {
            return { allowed: false, reason: 'ALB and EC2 are in different VPCs' };
        }

        return { allowed: true, reason: 'ALB and EC2 are in same VPC' };
    }

    private async verifyEc2ToEc2(source: AWSResource, target: AWSResource): Promise<VerificationResult> {
        const sourceSubnet = this.data.subnets?.find(s => s.SubnetId === source.subnetId);
        const targetSubnet = this.data.subnets?.find(s => s.SubnetId === target.subnetId);

        if (!sourceSubnet || !targetSubnet) {
            return { allowed: false, reason: 'Subnet not found' };
        }

        if (sourceSubnet.VpcId !== targetSubnet.VpcId) {
            return { allowed: false, reason: 'EC2 instances are in different VPCs' };
        }

        const routeTable = this.data.route_tables?.find(rt =>
            rt.Associations?.some(a => a.SubnetId === source.subnetId)
        );

        if (!routeTable) {
            return { allowed: false, reason: 'No route table found' };
        }

        const localRoute = routeTable.Routes?.find(r =>
            r.DestinationCidrBlock === targetSubnet.CidrBlock &&
            r.State === 'active'
        );

        if (localRoute) {
            return { allowed: true, reason: 'Local route exists' };
        }

        return { allowed: false, reason: 'No valid route found' };
    }
}

// Main ConnectivityVerifier class
export class ConnectivityVerifier {
    private data: CloudQueryResult['data'];
    private strategies: BaseVerificationStrategy[];

    constructor(data: CloudQueryResult['data']) {
        this.data = data;
        this.strategies = [
            new SecurityGroupStrategy(data),
            new NetworkAclStrategy(data),
            new RouteTableStrategy(data)
        ];
    }

    public async verifyConnectivity(): Promise<ConnectivityCheck[]> {
        console.log('=== Starting Connectivity Verification ===');
        
        // Validate input data
        if (!this.data) {
            throw new Error('No data provided for connectivity verification');
        }
        
        if (!this.data.instances && !this.data.s3_buckets && !this.data.load_balancers) {
            throw new Error('No AWS resources found in the provided data');
        }

        const checks: ConnectivityCheck[] = [];
        const pairs = this.getValidResourcePairs();

        for (const { source, target } of pairs) {
            console.log('\n=== Checking Connectivity ===');
            console.log('Source:', JSON.stringify(source, null, 2));
            console.log('Target:', JSON.stringify(target, null, 2));
            
            let success = true;
            let failureReason: string | undefined;

            try {
                for (const strategy of this.strategies) {
                    const result = await strategy.verify(source, target);
                    if (!result.allowed) {
                        success = false;
                        failureReason = result.reason;
                        break;
                    }
                }
            } catch (error) {
                console.error('Error during verification:', error);
                success = false;
                failureReason = error instanceof Error ? error.message : 'Unknown error';
            }

            const check = {
                sourceId: source.id,
                sourceLabel: source.type,
                targetId: target.id,
                targetLabel: target.type,
                success,
                failureReason: success ? 'All connectivity checks passed' : failureReason
            };
            console.log('\nFinal Check Result:', JSON.stringify(check, null, 2));
            checks.push(check);
        }

        console.log('\n=== Verification Complete ===');
        console.log('Total Checks:', checks.length);
        console.log('Results:', JSON.stringify(checks, null, 2));
        return checks;
    }

    private getValidResourcePairs(): Array<{
        source: AWSResource;
        target: AWSResource;
    }> {
        console.log('Getting valid resource pairs from data:', JSON.stringify(this.data, null, 2));
        const pairs: Array<{
            source: AWSResource;
            target: AWSResource;
        }> = [];

        const instances = this.data.instances || [];
        const s3Buckets = this.data.s3_buckets || [];
        const loadBalancers = this.data.load_balancers || [];
        const internetGateways = this.data.internet_gateways || [];

        console.log('Found resources:', {
            instances: instances.length,
            s3Buckets: s3Buckets.length,
            loadBalancers: loadBalancers.length,
            internetGateways: internetGateways.length
        });

        // EC2 to S3 connections
        for (const source of instances) {
            const sourceSubnet = this.data.subnets?.find(s => s.SubnetId === source.SubnetId);
            if (!sourceSubnet) continue;

            const sourceVpc = sourceSubnet.VpcId;
            if (!sourceVpc) continue;

            // Add S3 bucket connections
            for (const target of s3Buckets) {
                pairs.push({
                    source: {
                        id: source.InstanceId,
                        type: 'EC2',
                        subnetId: source.SubnetId,
                        securityGroupIds: source.SecurityGroups?.map(sg => sg.GroupId) || [],
                        vpcId: sourceVpc,
                        cidrBlock: sourceSubnet.CidrBlock,
                        properties: {}
                    },
                    target: {
                        id: target.Name,
                        type: 'S3',
                        subnetId: null,
                        securityGroupIds: [],
                        vpcId: null,
                        properties: {
                            name: target.Name,
                            creationDate: target.CreationDate
                        }
                    }
                });
            }

            // Check for same VPC connections
            for (const target of instances) {
                if (source.InstanceId === target.InstanceId) continue;
                
                const targetSubnet = this.data.subnets?.find(s => s.SubnetId === target.SubnetId);
                if (!targetSubnet) continue;

                const targetVpc = targetSubnet.VpcId;
                if (!targetVpc) continue;

                pairs.push({
                    source: {
                        id: source.InstanceId,
                        type: 'EC2',
                        subnetId: source.SubnetId,
                        securityGroupIds: source.SecurityGroups?.map(sg => sg.GroupId) || [],
                        vpcId: sourceVpc,
                        cidrBlock: sourceSubnet.CidrBlock,
                        properties: {}
                    },
                    target: {
                        id: target.InstanceId,
                        type: 'EC2',
                        subnetId: target.SubnetId,
                        securityGroupIds: target.SecurityGroups?.map(sg => sg.GroupId) || [],
                        vpcId: targetVpc,
                        cidrBlock: targetSubnet.CidrBlock,
                        properties: {}
                    }
                });
            }

            // Check for Internet connectivity through IGW
            const attachedIgw = internetGateways.find(igw => 
                igw.Attachments?.some(att => 
                    att.VpcId === sourceVpc && 
                    (att.State === 'attached' || att.State === 'available')
                )
            );

            if (attachedIgw) {
                pairs.push({
                    source: {
                        id: source.InstanceId,
                        type: 'EC2',
                        subnetId: source.SubnetId,
                        securityGroupIds: source.SecurityGroups?.map(sg => sg.GroupId) || [],
                        vpcId: sourceVpc,
                        cidrBlock: sourceSubnet.CidrBlock,
                        properties: {}
                    },
                    target: {
                        id: attachedIgw.InternetGatewayId,
                        type: 'IGW',
                        subnetId: null,
                        securityGroupIds: [],
                        vpcId: sourceVpc,
                        cidrBlock: '0.0.0.0/0',
                        properties: {}
                    }
                });
            }
        }

        // ALB to EC2 connections
        for (const source of loadBalancers) {
            if (!source.VpcId) continue;

            for (const target of instances) {
                const targetSubnet = this.data.subnets?.find(s => s.SubnetId === target.SubnetId);
                if (!targetSubnet) continue;

                const targetVpc = targetSubnet.VpcId;
                if (source.VpcId !== targetVpc) continue;

                pairs.push({
                    source: {
                        id: source.LoadBalancerArn,
                        type: 'ALB',
                        subnetId: source.SubnetIds?.[0] || '',
                        securityGroupIds: source.SecurityGroups || [],
                        vpcId: source.VpcId,
                        properties: {}
                    },
                    target: {
                        id: target.InstanceId,
                        type: 'EC2',
                        subnetId: target.SubnetId,
                        securityGroupIds: target.SecurityGroups?.map(sg => sg.GroupId) || [],
                        vpcId: targetVpc,
                        cidrBlock: targetSubnet.CidrBlock,
                        properties: {}
                    }
                });
            }
        }

        // ALB to IGW connections
        for (const source of loadBalancers) {
            if (!source.VpcId) continue;

            const attachedIgw = internetGateways.find(igw => 
                igw.Attachments?.some(att => 
                    att.VpcId === source.VpcId && 
                    (att.State === 'attached' || att.State === 'available')
                )
            );

            if (attachedIgw) {
                pairs.push({
                    source: {
                        id: source.LoadBalancerArn,
                        type: 'ALB',
                        subnetId: source.SubnetIds?.[0] || '',
                        securityGroupIds: source.SecurityGroups || [],
                        vpcId: source.VpcId,
                        properties: {}
                    },
                    target: {
                        id: attachedIgw.InternetGatewayId,
                        type: 'IGW',
                        subnetId: null,
                        securityGroupIds: [],
                        vpcId: source.VpcId,
                        cidrBlock: '0.0.0.0/0',
                        properties: {}
                    }
                });
            }
        }

        console.log('Generated pairs:', JSON.stringify(pairs, null, 2));
        return pairs;
    }
}

// Add CloudQueryResult interface
interface CloudQueryResult {
    userId: string;
    connectionId: string;
    data: {
        instances?: Array<{
            InstanceId: string;
            InstanceType: string;
            State: string;
            PrivateIpAddress: string;
            PublicIpAddress?: string;
            SubnetId: string;
            SecurityGroups?: Array<{ GroupId: string }>;
            SecurityGroupIds?: string[];
        }>;
        vpcs?: Array<{
            VpcId: string;
            State: string;
            CidrBlock: string;
        }>;
        subnets?: Array<{
            SubnetId: string;
            State: string;
            CidrBlock: string;
            AvailabilityZone: string;
            VpcId: string;
        }>;
        security_groups?: Array<{
            GroupId: string;
            InboundRules?: Array<{
                IpProtocol: string;
                FromPort?: number;
                ToPort?: number;
                UserIdGroupPairs: Array<{ GroupId: string }>;
                IpRanges: Array<{ CidrIp: string }>;
            }>;
            OutboundRules?: Array<{
                IpProtocol: string;
                FromPort?: number;
                ToPort?: number;
                UserIdGroupPairs: Array<{ GroupId: string }>;
                IpRanges: Array<{ CidrIp: string }>;
            }>;
        }>;
        s3_buckets?: Array<{
            Name: string;
            CreationDate: string;
        }>;
        route_tables?: Array<{
            RouteTableId: string;
            Routes?: Array<{
                DestinationCidrBlock: string;
                GatewayId?: string;
                Origin: string;
                State: string;
            }>;
            Associations?: Array<{
                SubnetId: string;
            }>;
        }>;
        internet_gateways?: Array<{
            InternetGatewayId: string;
            Attachments?: Array<{
                VpcId: string;
                State: string;
            }>;
        }>;
        network_acls?: Array<{
            NetworkAclId: string;
            Entries?: Array<{
                RuleNumber: number;
                Protocol: string;
                RuleAction: string;
                Egress: boolean;
                CidrBlock: string;
                SubnetId?: string;
                FromPort?: number;
                ToPort?: number;
            }>;
            Associations?: Array<{
                SubnetId: string;
            }>;
        }>;
        load_balancers?: Array<{
            LoadBalancerArn: string;
            LoadBalancerName: string;
            VpcId: string;
            Type: string;
            Scheme: string;
            State: string;
            SecurityGroups?: string[];
            SubnetIds?: string[];
        }>;
        vpc_peering_connections?: Array<{
            RequesterVpcId: string;
            AccepterVpcId: string;
            Status: string;
        }>;
        vpc_endpoints?: Array<{
            VpcId: string;
            ServiceName: string;
            State: string;
        }>;
    };
}

interface ConnectivityCheck {
    sourceId: string;
    sourceLabel: string;
    targetId: string;
    targetLabel: string;
    success: boolean;
    failureReason?: string;
} 