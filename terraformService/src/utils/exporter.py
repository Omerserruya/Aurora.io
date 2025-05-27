from src.utils.tf_resources import generate_amis,generate_instances,generate_subnets,generate_vpcs,generate_security_groups,generate_s3_buckets,generate_route_tables,generate_internet_gateways,generate_network_acls,generate_load_balancers

def generate_tf_resources(data):
    print(data)
    
    # Initialize all variables
    vpcs = ""
    subnets = ""
    amis = ""
    instances = ""
    security_groups = ""
    s3_buckets = ""
    route_tables = ""
    internet_gateways = ""
    network_acls = ""
    load_balancers = ""
    
    # Generate VPC file
    if data.get("vpcs") and len(data["vpcs"]) > 0:
        vpcs = generate_vpcs(data["vpcs"])

    # Generate Subnets file
    if data.get("subnets") and len(data["subnets"]) > 0:
        subnets = generate_subnets(data["subnets"])

    # Generate AMIs file
    if data.get("amis") and len(data["amis"]) > 0:
        amis = generate_amis(data["amis"])

    # Generate Instances file
    if data.get("instances") and len(data["instances"]) > 0:
        instances = generate_instances(data["instances"])

    # Generate Security Groups file
    if data.get("securityGroupRules") and len(data["securityGroupRules"]) > 0:
        security_groups = generate_security_groups(data["securityGroupRules"])

    # Generate S3 Buckets file
    if data.get("s3Buckets") and len(data["s3Buckets"]) > 0:
        s3_buckets = generate_s3_buckets(data["s3Buckets"])

    # Generate Route Tables file
    if data.get("routeTables") and len(data["routeTables"]) > 0:
        route_tables = generate_route_tables(data["routeTables"])

    # Generate Internet Gateways file
    if data.get("internetGateways") and len(data["internetGateways"]) > 0:
        internet_gateways = generate_internet_gateways(data["internetGateways"])

    # Generate Network ACLs file
    if data.get("networkAcls") and len(data["networkAcls"]) > 0:
        network_acls = generate_network_acls(data["networkAcls"])

    # Generate Load Balancers file
    if data.get("loadBalancers") and len(data["loadBalancers"]) > 0:
        load_balancers = generate_load_balancers(data["loadBalancers"])

    return {'data':{
        'vpcs': vpcs,
        'subnets': subnets,
        'amis': amis,
        'instances': instances,
        'securityGroupRules': security_groups,
        's3Buckets': s3_buckets,
        'routeTables': route_tables,
        'internetGateways': internet_gateways,
        'networkAcls': network_acls,
        'loadBalancers': load_balancers
    }}