def generate_instances(instances_data):
    instance_content = ""
    for instance in instances_data:
        # Create safe resource name from instance name/ID
        resource_name = instance['name'].replace('-', '_')
        
        # Use consistent subnet naming - convert subnet_name to proper resource reference
        subnet_name = instance['subnet_name']
        subnet_resource_name = subnet_name.replace('-', '_')
        
        instance_content += f"""
resource "aws_instance" "{resource_name}" {{
  ami           = "{instance['ami_id']}"
  instance_type = "{instance['instance_type']}"
  subnet_id     = aws_subnet.{subnet_resource_name}.id

  tags = {{
"""
        for tag_key, tag_value in instance["tags"].items():
            instance_content += f'    {tag_key} = "{tag_value}"\n'
        instance_content += "  }\n}\n"
    return instance_content


def generate_amis(ami_data):
    ami_content = ""
    for ami in ami_data:
        ami_content += f"""
data "aws_ami" "{ami['name']}" {{
  most_recent = true
  owners      = ["self"] 

  tags = {{
"""
        for tag_key, tag_value in ami["tags"].items():
            ami_content += f'    {tag_key} = "{tag_value}"\n'
        ami_content += "  }\n}\n"
    return ami_content


def generate_subnets(subnets_data):
    subnet_content = ""
    for subnet in subnets_data:
        # Create safe resource name from subnet ID
        subnet_id = subnet.get('subnetId', subnet['name'])  # fallback to name if subnetId not available
        resource_name = subnet_id.replace('-', '_')
        
        # Use consistent VPC naming - need to get VPC ID from vpc_name
        vpc_name = subnet['vpc_name']
        vpc_resource_name = vpc_name.replace('-', '_')
        
        subnet_content += f"""
resource "aws_subnet" "{resource_name}" {{
  vpc_id     = aws_vpc.{vpc_resource_name}.id
  cidr_block = "{subnet['cidr_block']}"

  tags = {{
    Name = "{subnet['name']}"
  }}
}}
"""
    return subnet_content


def generate_vpcs(vpcs_data):
    vpc_content = ""
    for vpc in vpcs_data:
        # Use vpcId for consistent resource naming across all resources
        vpc_id = vpc.get('vpcId', vpc['name'])  # fallback to name if vpcId not available
        resource_name = vpc_id.replace('-', '_')
        
        vpc_content += f"""
resource "aws_vpc" "{resource_name}" {{
  cidr_block = "{vpc['cidr_block']}"

  tags = {{
    Name = "{vpc['name']}"
  }}
}}
"""
    return vpc_content


def generate_security_groups(security_groups_data):
    sg_content = ""
    for sg_item in security_groups_data:
        sg = sg_item['securityGroup']
        group_id = sg['groupId']
        properties = sg['properties']
        
        # Create a safe resource name from the group ID
        resource_name = group_id.replace('-', '_')
        
        # Use consistent VPC naming
        vpc_id = properties.get('vpcId', 'default')
        vpc_name = vpc_id.replace('-', '_')
        
        sg_content += f"""
resource "aws_security_group" "{resource_name}" {{
  name        = "{properties.get('groupName', group_id)}"
  description = "{properties.get('description', 'Security group')}"
  vpc_id      = aws_vpc.{vpc_name}.id

"""
        
        # Process inbound rules
        inbound_rules = [rule for rule in sg['rules'] if rule['ruleType'] == 'inbound']
        for rule in inbound_rules:
            rule_props = rule['properties']
            protocol = rule_props.get('ipProtocol', 'tcp')
            from_port = rule_props.get('fromPort')
            to_port = rule_props.get('toPort')
            
            sg_content += "  ingress {\n"
            sg_content += f"    protocol    = \"{protocol}\"\n"
            
            # For protocol -1 (all traffic), set ports to 0. For other protocols, use actual port values
            if protocol == '-1':
                sg_content += f"    from_port   = 0\n"
                sg_content += f"    to_port     = 0\n"
            else:
                if from_port is not None:
                    sg_content += f"    from_port   = {from_port}\n"
                if to_port is not None:
                    sg_content += f"    to_port     = {to_port}\n"
            
            # Handle IP ranges
            ip_ranges = rule_props.get('ipRanges', [])
            if ip_ranges:
                cidr_blocks = ', '.join([f'"{ip}"' for ip in ip_ranges])
                sg_content += f"    cidr_blocks = [{cidr_blocks}]\n"
            
            # Handle IPv6 ranges
            ipv6_ranges = rule_props.get('ipv6Ranges', [])
            if ipv6_ranges:
                ipv6_blocks = ', '.join([f'"{ip}"' for ip in ipv6_ranges])
                sg_content += f"    ipv6_cidr_blocks = [{ipv6_blocks}]\n"
            
            # Handle security group references
            sg_refs = rule_props.get('userIdGroupPairs', [])
            if sg_refs:
                # Extract group IDs from the format "userId:groupId"
                group_ids = []
                for ref in sg_refs:
                    if ':' in ref:
                        group_id = ref.split(':')[1]
                        group_ids.append(f'aws_security_group.{group_id.replace("-", "_")}.id')
                    else:
                        group_ids.append(f'"{ref}"')
                
                if group_ids:
                    sg_content += f"    security_groups = [{', '.join(group_ids)}]\n"
            
            sg_content += "  }\n\n"
        
        # Process outbound rules
        outbound_rules = [rule for rule in sg['rules'] if rule['ruleType'] == 'outbound']
        for rule in outbound_rules:
            rule_props = rule['properties']
            protocol = rule_props.get('ipProtocol', 'tcp')
            from_port = rule_props.get('fromPort')
            to_port = rule_props.get('toPort')
            
            sg_content += "  egress {\n"
            sg_content += f"    protocol    = \"{protocol}\"\n"
            
            # For protocol -1 (all traffic), set ports to 0. For other protocols, use actual port values
            if protocol == '-1':
                sg_content += f"    from_port   = 0\n"
                sg_content += f"    to_port     = 0\n"
            else:
                if from_port is not None:
                    sg_content += f"    from_port   = {from_port}\n"
                if to_port is not None:
                    sg_content += f"    to_port     = {to_port}\n"
            
            # Handle IP ranges
            ip_ranges = rule_props.get('ipRanges', [])
            if ip_ranges:
                cidr_blocks = ', '.join([f'"{ip}"' for ip in ip_ranges])
                sg_content += f"    cidr_blocks = [{cidr_blocks}]\n"
            
            # Handle IPv6 ranges
            ipv6_ranges = rule_props.get('ipv6Ranges', [])
            if ipv6_ranges:
                ipv6_blocks = ', '.join([f'"{ip}"' for ip in ipv6_ranges])
                sg_content += f"    ipv6_cidr_blocks = [{ipv6_blocks}]\n"
            
            # Handle security group references
            sg_refs = rule_props.get('userIdGroupPairs', [])
            if sg_refs:
                # Extract group IDs from the format "userId:groupId"
                group_ids = []
                for ref in sg_refs:
                    if ':' in ref:
                        group_id = ref.split(':')[1]
                        group_ids.append(f'aws_security_group.{group_id.replace("-", "_")}.id')
                    else:
                        group_ids.append(f'"{ref}"')
                
                if group_ids:
                    sg_content += f"    security_groups = [{', '.join(group_ids)}]\n"
            
            sg_content += "  }\n\n"
        
        sg_content += f"""  tags = {{
    Name = "{properties.get('groupName', group_id)}"
  }}
}}

"""
    
    return sg_content


def generate_s3_buckets(s3_buckets_data):
    s3_content = ""
    for bucket in s3_buckets_data:
        # Create a safe resource name from the bucket name
        resource_name = bucket['name'].replace('-', '_').replace('.', '_')
        
        s3_content += f"""
resource "aws_s3_bucket" "{resource_name}" {{
  bucket = "{bucket['name']}"

  tags = {{
    Name = "{bucket['name']}"
  }}
}}

resource "aws_s3_bucket_versioning" "{resource_name}_versioning" {{
  bucket = aws_s3_bucket.{resource_name}.id
  versioning_configuration {{
    status = "Enabled"
  }}
}}

resource "aws_s3_bucket_server_side_encryption_configuration" "{resource_name}_encryption" {{
  bucket = aws_s3_bucket.{resource_name}.id

  rule {{
    apply_server_side_encryption_by_default {{
      sse_algorithm = "AES256"
    }}
  }}
}}

"""
    return s3_content


def generate_route_tables(route_tables_data):
    rt_content = ""
    for rt in route_tables_data:
        # Create a safe resource name from the route table ID
        resource_name = rt['routeTableId'].replace('-', '_')
        # Use consistent VPC naming
        vpc_id = rt['vpcId']
        vpc_name = vpc_id.replace('-', '_')
        
        rt_content += f"""
resource "aws_route_table" "{resource_name}" {{
  vpc_id = aws_vpc.{vpc_name}.id

"""
        
        # Add routes
        for route in rt.get('routes', []):
            gateway_id = route.get('gatewayId')
            if gateway_id and gateway_id != 'local':  # Skip local routes as they're automatic
                rt_content += f"""  route {{
    cidr_block = "{route['destinationCidrBlock']}"
    gateway_id = "{gateway_id}"
  }}
"""
        
        rt_content += f"""
  tags = {{
    Name = "{rt['routeTableId']}"
  }}
}}

"""
        
        # Add route table associations
        for assoc in rt.get('associations', []):
            if assoc['subnetId']:
                assoc_name = f"{resource_name}_{assoc['subnetId'].replace('-', '_')}"
                subnet_name = assoc['subnetId'].replace('-', '_')
                rt_content += f"""
resource "aws_route_table_association" "{assoc_name}" {{
  subnet_id      = aws_subnet.{subnet_name}.id
  route_table_id = aws_route_table.{resource_name}.id
}}

"""
    
    return rt_content


def generate_internet_gateways(internet_gateways_data):
    igw_content = ""
    for igw in internet_gateways_data:
        # Create a safe resource name from the IGW ID
        resource_name = igw['internetGatewayId'].replace('-', '_')
        
        igw_content += f"""
resource "aws_internet_gateway" "{resource_name}" {{
"""
        
        # Add VPC attachments
        for attachment in igw.get('attachments', []):
            # Use the same naming convention as VPC resources (clean name, not full ID)
            vpc_id = attachment['vpcId']
            vpc_name = vpc_id.replace('-', '_')
            igw_content += f"  vpc_id = aws_vpc.{vpc_name}.id\n"
            break  # IGW can only be attached to one VPC
        
        igw_content += f"""
  tags = {{
    Name = "{igw['internetGatewayId']}"
  }}
}}

"""
    
    return igw_content


def generate_network_acls(network_acls_data):
    acl_content = ""
    for acl in network_acls_data:
        # Create a safe resource name from the ACL ID
        resource_name = acl['networkAclId'].replace('-', '_')
        # Use the same naming convention as VPC resources
        vpc_id = acl['vpcId']
        vpc_name = vpc_id.replace('-', '_')
        
        acl_content += f"""
resource "aws_network_acl" "{resource_name}" {{
  vpc_id = aws_vpc.{vpc_name}.id

"""
        
        # Process all entries - check if egress field exists
        for entry in acl.get('entries', []):
            # Skip the default deny rule (32767) as it's automatically created
            rule_number = entry.get('ruleNumber', 100)
            if rule_number == 32767:
                continue
                
            # Check if this is an egress rule (some data might not have egress field)
            egress = entry.get('egress', 'false')
            rule_type = "egress" if egress == 'true' else "ingress"
            
            acl_content += f"""  {rule_type} {{
    protocol   = "{entry.get('protocol', '-1')}"
    rule_no    = {rule_number}
    action     = "{entry.get('ruleAction', 'allow')}"
    cidr_block = "{entry.get('cidrBlock', '0.0.0.0/0')}"
    from_port  = 0
    to_port    = 65535
  }}
"""
        
        acl_content += f"""
  tags = {{
    Name = "{acl['networkAclId']}"
  }}
}}

"""
    
    return acl_content


def generate_load_balancers(load_balancers_data):
    lb_content = ""
    for lb in load_balancers_data:
        # Create a safe resource name from the LB ARN
        arn_parts = lb['loadBalancerArn'].split('/')
        resource_name = arn_parts[-1].replace('-', '_') if arn_parts else lb['loadBalancerArn'].replace('-', '_')
        
        lb_content += f"""
resource "aws_lb" "{resource_name}" {{
  name               = "{lb['loadBalancerName']}"
  internal           = {str(lb['scheme'] != 'internet-facing').lower()}
  load_balancer_type = "{lb['type']}"
  
  # TODO: Specify actual subnets from your infrastructure
  # Example subnets - replace with your actual subnet references
  subnets = [
    # aws_subnet.your_subnet_1.id,
    # aws_subnet.your_subnet_2.id
  ]

  enable_deletion_protection = false

  tags = {{
    Name = "{lb['loadBalancerName']}"
  }}
}}

"""
    
    return lb_content

