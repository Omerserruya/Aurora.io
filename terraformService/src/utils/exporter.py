from src.utils.tf_resources import generate_amis,generate_instances,generate_subnets,generate_vpcs

def generate_tf_resources(data):
    # Generate VPC file
    vpcs = generate_vpcs(data["vpcs"])

    # Generate Subnets file
    subnets = generate_subnets(data["subnets"])

    # Generate AMIs file
    amis = generate_amis(data["amis"])

    # Generate Instances file
    instances = generate_instances(data["instances"])

    return { 'data': {
        'vpcs': vpcs,
        'subnets': subnets,
        'amis': amis,
        'instances': instances
    } }