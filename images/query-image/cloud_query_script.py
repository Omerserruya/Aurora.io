import os
import json
import boto3
import hashlib
import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
from datetime import datetime

def decrypt(encrypted_text):
    # Get encryption key from environment variable
    encryption_key = os.environ.get('ENCRYPTION_KEY')
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set")

    # Create a 32-byte key using SHA-256 (same as Node.js)
    key = hashlib.sha256(encryption_key.encode()).digest()

    # Split the encrypted text into IV and encrypted data
    iv_hex, encrypted_hex = encrypted_text.split(':')
    iv = bytes.fromhex(iv_hex)
    encrypted_data = bytes.fromhex(encrypted_hex)

    # Create cipher and decrypt
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted_data = cipher.decrypt(encrypted_data)
    
    # Remove padding
    unpadded_data = unpad(decrypted_data, AES.block_size)
    
    return unpadded_data.decode()

# Decrypt and set credentials at startup
def setup_credentials():
    # Decrypt credentials
    access_key_id = decrypt(os.getenv("AWS_ACCESS_KEY_ID"))
    secret_access_key = decrypt(os.getenv("AWS_SECRET_ACCESS_KEY"))
    
    # Set decrypted credentials as environment variables
    os.environ["AWS_ACCESS_KEY_ID"] = access_key_id
    os.environ["AWS_SECRET_ACCESS_KEY"] = secret_access_key

def get_aws_session():
    """Creates a session using AWS credentials from environment variables."""
    return boto3.Session(region_name=os.getenv("AWS_REGION", "us-east-1"))

def convert_datetime(obj):
    """Recursively convert datetime objects to ISO format strings."""
    if isinstance(obj, dict):
        return {k: convert_datetime(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def send_results_to_db(results):
    """Sends the results to the database controller."""
    db_url = os.getenv("DB_SERVICE_URL")
    if not db_url:
        raise ValueError("DB_SERVICE_URL environment variable is not set")

    user_id = os.getenv("userID")
    connection_id = os.getenv("CONNECTION_ID")

    if not user_id:
        raise ValueError("userID environment variable is not set")
    if not connection_id:
        raise ValueError("CONNECTION_ID environment variable is not set")

    # Convert datetime objects
    safe_results = convert_datetime(results)

    payload = {
        "userId": user_id,
        "connectionId": connection_id,
        "data": safe_results
    }

    try:
        response = requests.post(
            f"{db_url}/cloud-query-results",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(response.json())
        response.raise_for_status()
        print(f"Successfully sent results to database. Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending results to database: {str(e)}")
        raise

def get_ec2_instances(session, config):
    """Retrieves EC2 instances based on the configured properties."""
    ec2_client = session.client("ec2")
    instances = ec2_client.describe_instances()["Reservations"]
    results = []
    for res in instances:
        for instance in res["Instances"]:
            instance_data = {}
            for prop in config.get("ec2", []):
                if prop == "Image":
                    image_id = instance.get("ImageId")
                    if image_id:
                        image = ec2_client.describe_images(ImageIds=[image_id])["Images"][0]
                        instance_data["ImageId"] = image.get("ImageId")
                        instance_data["ImageName"] = image.get("Name")
                        instance_data["ImageDescription"] = image.get("Description")
                        instance_data["ImageCreationDate"] = image.get("CreationDate")
                else:
                    instance_data[prop] = instance.get(prop, None)
            results.append(instance_data)
    return results

def get_vpcs(session, config):
    """Retrieves VPCs based on the configured properties."""
    ec2_client = session.client("ec2")
    vpcs = ec2_client.describe_vpcs()["Vpcs"]
    return [
        {
            prop: vpc.get(prop, None)
            for prop in config.get("vpc", [])
        }
        for vpc in vpcs
    ]

def get_subnets(session, config):
    """Retrieves subnets based on the configured properties."""
    ec2_client = session.client("ec2")
    subnets = ec2_client.describe_subnets()["Subnets"]
    return [
        {
            prop: subnet.get(prop, None)
            for prop in config.get("subnet", [])
        }
        for subnet in subnets
    ]

def get_security_groups(session, config):
    """Retrieves security groups based on the configured properties."""
    ec2_client = session.client("ec2")
    security_groups = ec2_client.describe_security_groups()["SecurityGroups"]
    
    results = []
    for sg in security_groups:
        sg_data = {}
        for prop in config.get("security_group", []):
            if prop == "InboundRules":
                sg_data[prop] = sg.get("IpPermissions", [])
            elif prop == "OutboundRules":
                sg_data[prop] = sg.get("IpPermissionsEgress", [])
            else:
                sg_data[prop] = sg.get(prop, None)
        results.append(sg_data)
    
    return results

def get_s3_buckets(session, config):
    """Retrieves S3 buckets based on the configured properties."""
    s3_client = session.client("s3")
    buckets = s3_client.list_buckets()["Buckets"]
    return [
        {
            prop: bucket.get(prop, None)
            for prop in config.get("s3", [])
        }
        for bucket in buckets
    ]

def get_route_tables(session, config):
    """Retrieves route tables based on the configured properties."""
    ec2_client = session.client("ec2")
    route_tables = ec2_client.describe_route_tables()["RouteTables"]
    return [
        {
            prop: rt.get(prop, None)
            for prop in config.get("route_table", [])
        }
        for rt in route_tables
    ]

def get_internet_gateways(session, config):
    """Retrieves internet gateways based on the configured properties."""
    ec2_client = session.client("ec2")
    internet_gateways = ec2_client.describe_internet_gateways()["InternetGateways"]
    return [
        {
            prop: igw.get(prop, None)
            for prop in config.get("internet_gateway", [])
        }
        for igw in internet_gateways
    ]

def get_nat_gateways(session, config):
    """Retrieves NAT gateways based on the configured properties."""
    ec2_client = session.client("ec2")
    nat_gateways = ec2_client.describe_nat_gateways()["NatGateways"]
    return [
        {
            prop: ngw.get(prop, None)
            for prop in config.get("nat_gateway", [])
        }
        for ngw in nat_gateways
    ]

def get_network_acls(session, config):
    """Retrieves network ACLs based on the configured properties."""
    ec2_client = session.client("ec2")
    network_acls = ec2_client.describe_network_acls()["NetworkAcls"]
    return [
        {
            prop: acl.get(prop, None)
            for prop in config.get("network_acl", [])
        }
        for acl in network_acls
    ]

def get_elastic_ips(session, config):
    """Retrieves elastic IPs based on the configured properties."""
    ec2_client = session.client("ec2")
    elastic_ips = ec2_client.describe_addresses()["Addresses"]
    return [
        {
            prop: eip.get(prop, None)
            for prop in config.get("elastic_ip", [])
        }
        for eip in elastic_ips
    ]

def get_transit_gateways(session, config):
    """Retrieves transit gateways based on the configured properties."""
    ec2_client = session.client("ec2")
    try:
        transit_gateways = ec2_client.describe_transit_gateways()["TransitGateways"]
        return [
            {
                prop: tgw.get(prop, None)
                for prop in config.get("transit_gateway", [])
            }
            for tgw in transit_gateways
        ]
    except ec2_client.exceptions.ClientError:
        # Transit Gateway might not be available in all regions
        return []

def get_load_balancers(session, config):
    """Retrieves load balancers based on the configured properties."""
    elbv2_client = session.client("elbv2")
    load_balancers = elbv2_client.describe_load_balancers()["LoadBalancers"]
    return [
        {
            prop: lb.get(prop, None)
            for prop in config.get("load_balancer", [])
        }
        for lb in load_balancers
    ]

def get_ecs_clusters(session, config):
    """Retrieves ECS clusters based on the configured properties."""
    ecs_client = session.client("ecs")
    cluster_arns = ecs_client.list_clusters()["clusterArns"]
    if not cluster_arns:
        return []
    
    clusters = ecs_client.describe_clusters(clusters=cluster_arns)["clusters"]
    return [
        {
            prop: cluster.get(prop, None)
            for prop in config.get("ecs_cluster", [])
        }
        for cluster in clusters
    ]

def get_ecs_tasks(session, config):
    """Retrieves ECS tasks based on the configured properties."""
    ecs_client = session.client("ecs")
    cluster_arns = ecs_client.list_clusters()["clusterArns"]
    if not cluster_arns:
        return []
    
    tasks = []
    for cluster_arn in cluster_arns:
        task_arns = ecs_client.list_tasks(cluster=cluster_arn)["taskArns"]
        if not task_arns:
            continue
            
        cluster_tasks = ecs_client.describe_tasks(cluster=cluster_arn, tasks=task_arns)["tasks"]
        tasks.extend([
            {
                prop: task.get(prop, None)
                for prop in config.get("ecs_task", [])
            }
            for task in cluster_tasks
        ])
    
    return tasks

def get_lambda_functions(session, config):
    """Retrieves Lambda functions based on the configured properties."""
    lambda_client = session.client("lambda")
    functions = lambda_client.list_functions()["Functions"]
    return [
        {
            prop: func.get(prop, None)
            for prop in config.get("lambda_function", [])
        }
        for func in functions
    ]

def get_iam_roles(session, config):
    """Retrieves IAM roles based on the configured properties."""
    iam_client = session.client("iam")
    roles = iam_client.list_roles()["Roles"]
    return [
        {
            prop: role.get(prop, None)
            for prop in config.get("iam_role", [])
        }
        for role in roles
    ]

def get_iam_users(session, config):
    """Retrieves IAM users based on the configured properties."""
    iam_client = session.client("iam")
    users = iam_client.list_users()["Users"]
    return [
        {
            prop: user.get(prop, None)
            for prop in config.get("iam_user", [])
        }
        for user in users
    ]

def get_iam_policies(session, config):
    """Retrieves IAM policies based on the configured properties."""
    iam_client = session.client("iam")
    policies = iam_client.list_policies()["Policies"]
    return [
        {
            prop: policy.get(prop, None)
            for prop in config.get("iam_policy", [])
        }
        for policy in policies
    ]

def load_config():
    """Loads the resource configuration from a JSON file or default settings."""
    config_path = os.getenv("CONFIG_PATH", "config.json")
    if os.path.exists(config_path):
        with open(config_path, "r") as file:
            return json.load(file)
    return {
        "ec2": ["InstanceId", "InstanceType", "VpcId", "SubnetId", "ImageId", "Image"],
        "vpc": ["VpcId", "CidrBlock"],
        "subnet": ["SubnetId", "VpcId", "CidrBlock"],
        "security_group": ["GroupId", "GroupName", "VpcId", "Description"],
        "s3": ["Name", "CreationDate"]
    }

def main():
    # Decrypt credentials before starting
    setup_credentials()
   

    session = get_aws_session()
    config = load_config()
    
    results = {
        "instances": get_ec2_instances(session, config),
        "vpcs": get_vpcs(session, config),
        "subnets": get_subnets(session, config),
        "security_groups": get_security_groups(session, config),
        "s3_buckets": get_s3_buckets(session, config),
        "route_tables": get_route_tables(session, config),
        "internet_gateways": get_internet_gateways(session, config),
        "nat_gateways": get_nat_gateways(session, config),
        "network_acls": get_network_acls(session, config),
        "elastic_ips": get_elastic_ips(session, config),
        "transit_gateways": get_transit_gateways(session, config),
        "load_balancers": get_load_balancers(session, config),
        "ecs_clusters": get_ecs_clusters(session, config),
        "ecs_tasks": get_ecs_tasks(session, config),
        "lambda_functions": get_lambda_functions(session, config),
        "iam_roles": get_iam_roles(session, config),
        "iam_users": get_iam_users(session, config),
        "iam_policies": get_iam_policies(session, config)
    }
    
    # Send results to database instead of printing
    send_results_to_db(results)

if __name__ == "__main__":
    main()
