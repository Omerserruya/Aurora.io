from flask import Flask, Blueprint, request, jsonify
from src.utils.data import get_remote_data
from src.utils.exporter import generate_tf_resources

# Create the IaC blueprint
iac_bp = Blueprint('iac', __name__, url_prefix='/iac')

@iac_bp.route('/generate_tf', methods=['GET'])
def iac_gen_tf():
    user_id = request.args.get('user_id')
    account_id = request.args.get('account_id')
    data = get_remote_data(user_id, account_id)
    if data:
        return jsonify(generate_tf_resources(data))
    return jsonify({
        "status": "error",
        "message": "No data found"
    })

@iac_bp.route('/status', methods=['GET'])
def iac_status():
    return jsonify({
        "status": "operational",
        "last_check": "2024-03-26T00:00:00Z",
        "services": {
            "terraform": "available",
            "state": "locked"
        }
    }) 