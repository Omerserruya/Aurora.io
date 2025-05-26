def generate_instances(instances_data):
    instance_content = ""
    for instance in instances_data:
        instance_content += f"""
resource "aws_instance" "{instance['name']}" {{
  ami           = "{instance['ami_id']}"
  instance_type = "{instance['instance_type']}"
  subnet_id     = aws_subnet.{instance['subnet_name']}.id

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
        subnet_content += f"""
resource "aws_subnet" "{subnet['name']}" {{
  vpc_id     = aws_vpc.{subnet['vpc_name']}.id
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
        vpc_content += f"""
resource "aws_vpc" "{vpc['name']}" {{
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
        
        sg_content += f"""
resource "aws_security_group" "{resource_name}" {{
  name        = "{properties.get('groupName', group_id)}"
  description = "{properties.get('description', 'Security group')}"
  vpc_id      = aws_vpc.{properties.get('vpcId', 'default').replace('-', '_')}.id

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

