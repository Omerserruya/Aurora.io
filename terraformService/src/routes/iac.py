from flask import Flask, Blueprint, request, jsonify
from functools import wraps
import jwt
import os
from src.utils.data import get_remote_data
from src.utils.exporter import generate_tf_resources

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_token = request.cookies.get('accessToken')
        
        if not auth_token:
            return jsonify({'message': 'Missing authentication token'}), 401

        try:
            # Verify the JWT token
            payload = jwt.decode(auth_token, JWT_SECRET_KEY, algorithms=["HS256"])
            # Add user info to request context
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

# Create the IaC blueprint
iac_bp = Blueprint('iac', __name__, url_prefix='/iac')

@iac_bp.route('/generate_tf', methods=['GET'])
@require_auth
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