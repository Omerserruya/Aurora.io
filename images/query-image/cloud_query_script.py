import os
import json
import boto3
import hashlib
import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

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

def send_results_to_db(results):
    """Sends the results to the database controller."""
    db_url = os.getenv("DB_SERVICE_URL")
    if not db_url:
        raise ValueError("DB_SERVICE_URL environment variable is not set")

    # Get user ID and connection ID from environment
    user_id = os.getenv("userID")
    connection_id = os.getenv("CONNECTION_ID")
    
    if not user_id:
        raise ValueError("userID environment variable is not set")
    if not connection_id:
        raise ValueError("CONNECTION_ID environment variable is not set")

    # Prepare the payload
    payload = {
        "userId": user_id,
        "connectionId": connection_id,
        "data": results
    }

    try:
        response = requests.post(
            f"{db_url}/cloud-query-results",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()  # Raise an exception for bad status codes
        print(f"Successfully sent results to database. Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending results to database: {str(e)}")
        raise

def get_ec2_instances(session, config):
    """Retrieves EC2 instances based on the configured properties."""
    ec2_client = session.client("ec2")
    instances = ec2_client.describe_instances()["Reservations"]
    return [
        {
            prop: instance.get(prop, None) if prop != "Image" else ec2_client.describe_images(ImageIds=[instance["ImageId"]])["Images"][0]
            for prop in config.get("ec2", [])
        }
        for res in instances for instance in res["Instances"]
    ]

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
    return [
        {
            prop: sg.get(prop, None)
            for prop in config.get("security_group", [])
        }
        for sg in security_groups
    ]

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
        "s3_buckets": get_s3_buckets(session, config)
    }
    
    # Send results to database instead of printing
    send_results_to_db(results)

if __name__ == "__main__":
    main()
