
def generate_instances(instances_data):
    instance_content = ""
    for instance in instances_data:
        instance_content += f"""
resource "aws_instance" "{instance['name']}" {{
  ami           = {instance['ami_id']}
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

