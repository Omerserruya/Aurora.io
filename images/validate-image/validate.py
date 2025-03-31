import boto3
import os

def get_aws_identity():
    # Fetch credentials from environment variables
    aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')

    # Initialize STS client
    sts_client = boto3.client(
        'sts',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key
    )

    # Get caller identity
    identity = sts_client.get_caller_identity()
    print("AWS Caller Identity:", identity)

if __name__ == "__main__":
    get_aws_identity()
