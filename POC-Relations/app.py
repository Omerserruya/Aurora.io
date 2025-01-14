import boto3
from neo4j import GraphDatabase

# Replace with your Neo4j connection details
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "your_password"

# Specify your AWS SSO profile name (the one configured with AWS CLI)
AWS_PROFILE = "a"  # Example: 'my-sso-profile'

def create_neo4j_connection():
    """Creates a connection to the Neo4j database."""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        return driver
    except Exception as e:
        print(f"Error connecting to Neo4j: {e}")
        return None

def get_aws_resources():
    """Retrieves AWS resources (EC2 instances, VPCs, and subnets)."""
    # Use the configured SSO profile to authenticate with boto3
    session = boto3.Session(profile_name=AWS_PROFILE, region_name="il-central-1")
    ec2 = session.client('ec2')

    # Get EC2 instances
    instances = ec2.describe_instances()['Reservations']

    # Get VPCs
    vpcs = ec2.describe_vpcs()['Vpcs']

    # Get subnets
    subnets = ec2.describe_subnets()['Subnets']

    return instances, vpcs, subnets

def create_nodes(tx, resources):
    """Creates nodes in Neo4j for EC2 instances, VPCs, and subnets."""
    for resource_type, resource_list in resources.items():
        for resource in resource_list:
            if resource_type == "instances":
                reservation = resource
                ownerId = reservation['OwnerId']
                reservationId = reservation['ReservationId']
                instances = reservation['Instances']
                for instance in instances:
                    node_id = instance['InstanceId']
                    properties = {
                        "OwnerId":ownerId,
                        "ReservationId":reservationId,
                        "InstanceType": instance['InstanceType'],
                        "AvailabilityZone": instance['Placement']['AvailabilityZone'],
                        "InstanceType":instance['InstanceType'],
                        "PrivateIpAddress": instance['PrivateIpAddress'],
                        "PublicIpAddress": instance['PublicIpAddress'],
                        "name":next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'Name'), None),
                        "securityGroupId":[group['GroupId'] for group in instance['SecurityGroups']],
                        "VpcId":instance['VpcId'],
                        "SubnetId":instance['SubnetId']
                    }
                    # Create the node for EC2 instance, passing properties directly
                    create_node_query = f"CREATE (n:{resource_type} {{ id: '{node_id}', " + ", ".join([f"{key}: ${key}" for key in properties]) + " })"
                    tx.run(create_node_query, **properties)

            elif resource_type == "vpcs":
                node_id = resource['VpcId']
                properties = {
                    "name": next((tag['Value'] for tag in resource.get('Tags', []) if tag['Key'] == 'Name'), None),
                    "CidrBlock": resource['CidrBlock']
                }
                # Create the node for VPC, passing properties directly
                create_node_query = f"CREATE (n:{resource_type} {{ __id: '{node_id}', " + ", ".join([f"{key}: ${key}" for key in properties]) + " })"
                tx.run(create_node_query, **properties)

            elif resource_type == "subnets":
                node_id = resource['SubnetId']
                properties = {
                    "CidrBlock": resource['CidrBlock'],
                    "AvailabilityZone": resource['AvailabilityZone'],
                    "VpcId":resource['VpcId'],
                    "AvailableIpAddressCount":resource['AvailableIpAddressCount'],
                    "name":next((tag['Value'] for tag in resource.get('Tags', []) if tag['Key'] == 'Name'), None),
                    "SubnetId":resource['SubnetId'],
                }
                # Create the node for Subnet, passing properties directly
                create_node_query = f"CREATE (n:{resource_type} {{ __id: '{node_id}', " + ", ".join([f"{key}: ${key}" for key in properties]) + " })"
                tx.run(create_node_query, **properties)


def run_query(tx, query, params):
    result = tx.run(query, **params)
    return result

def main():
    driver = create_neo4j_connection()
    if driver:
        with driver.session() as session:
            # Get AWS resources
            instances, vpcs, subnets = get_aws_resources()

            # Create nodes for all resources
            resources = {"instances": instances, "vpcs": vpcs, "subnets": subnets}
            session.execute_write(create_nodes, resources)

            # Create relationships between EC2 instances, subnets, and VPCs
            query = """
                MATCH (s:subnets),(v:vpcs)
                WHERE s.VpcId = v.`__id`
                MERGE (s)-[:CONNECTED_TO]->(v)
            """
            result = session.execute_write(run_query, query, {}) 
            query = """
                MATCH (s:subnets),(i:instances)
                WHERE i.SubnetId= s.`__id`
                MERGE (s)-[:CONNECTED_TO]->(i)
            """
            result = session.execute_write(run_query, query, {}) 
    driver.close()

if __name__ == "__main__":
    main()
