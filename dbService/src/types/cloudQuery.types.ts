export interface CloudQueryResult {
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
            VpcId?: string;
            ImageId?: string;
            ImageName?: string;
            ImageDescription?: string;
            ImageCreationDate?: string;
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
            GroupName?: string;
            VpcId?: string;
            Description?: string;
            InboundRules?: Array<{
                IpProtocol: string;
                FromPort?: number;
                ToPort?: number;
                UserIdGroupPairs: Array<{ UserId: string; GroupId: string }>;
                IpRanges: Array<{ CidrIp: string }>;
                Ipv6Ranges: Array<{ CidrIpv6: string }>;
                PrefixListIds: Array<{ PrefixListId: string }>;
            }>;
            OutboundRules?: Array<{
                IpProtocol: string;
                FromPort?: number;
                ToPort?: number;
                UserIdGroupPairs: Array<{ UserId: string; GroupId: string }>;
                IpRanges: Array<{ CidrIp: string }>;
                Ipv6Ranges: Array<{ CidrIpv6: string }>;
                PrefixListIds: Array<{ PrefixListId: string }>;
            }>;
        }>;
        s3_buckets?: Array<{
            Name: string;
            CreationDate: string;
        }>;
        route_tables?: Array<{
            RouteTableId: string;
            VpcId?: string;
            Routes?: Array<{
                DestinationCidrBlock: string;
                GatewayId?: string;
                Origin: string;
                State: string;
            }>;
            Associations?: Array<{
                RouteTableAssociationId: string;
                SubnetId: string;
                Main: boolean;
                AssociationState: {
                    State: string;
                };
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
            VpcId?: string;
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