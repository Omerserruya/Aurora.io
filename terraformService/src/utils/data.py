import json 
def load_mock_data(file_path="src/mock_aws_data.json"):
    with open(file_path, "r") as file:
        return json.load(file)

def get_remote_data(user_id, account_id):
    data = load_mock_data()
    return data