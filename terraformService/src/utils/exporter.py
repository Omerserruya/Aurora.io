from src.utils.tf_resources import generate_amis,generate_instances,generate_subnets,generate_vpcs,generate_security_groups

def generate_tf_resources(data):
    print(data)
    # Generate VPC file
    if data["vpcs"]:
        vpcs = generate_vpcs(data["vpcs"])

    # Generate Subnets file
    if data["subnets"]:
        subnets = generate_subnets(data["subnets"])


    # Generate AMIs file
    if data["amis"]:
        amis = generate_amis(data["amis"])


    # Generate Instances file
    if data["instances"]:
        instances = generate_instances(data["instances"])

    # Generate Security Groups file
    if data.get("securityGroupRules"):
        security_groups = generate_security_groups(data["securityGroupRules"])

    return {'data':{
        'vpcs': vpcs if len(data['vpcs']) > 0 else "",
        'subnets': subnets if len(data['subnets']) > 0 else "",
        'amis': amis if len(data['amis']) > 0 else "",
        'instances': instances if len(data['instances']) > 0 else "",
        'securityGroupRules': security_groups if len(data.get('securityGroupRules', [])) > 0 else ""
    }}