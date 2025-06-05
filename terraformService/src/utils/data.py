import json 
import requests
import os

DB_SERVICE_URL = os.getenv('DB_SERVICE_URL', 'https://aurora-io.cs.colman.ac.il')

def load_mock_data(file_path="src/mock_aws_data1.json"):
    with open(file_path, "r") as file:
        return json.load(file)

def get_remote_data(user_id, account_id):
    try:
        response = requests.get(f'{DB_SERVICE_URL}/neo/tf-query-results/{user_id}/{account_id}')
        return response.json()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Request failed: {e}")
    # data = load_mock_data()
    # return data