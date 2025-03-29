from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
import jwt
from src.routes.iac import iac_bp

# load_dotenv('.env.development')

app = Flask(__name__)
CORS(app, supports_credentials=True)

# JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')

# def require_auth(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         auth_token = request.cookies.get('token')
        
#         if not auth_token:
#             return jsonify({'message': 'Missing authentication token'}), 401

#         try:
#             # Verify the JWT token
#             payload = jwt.decode(auth_token, JWT_SECRET_KEY, algorithms=["HS256"])
#             # Add user info to request context
#             request.user = payload
#         except jwt.ExpiredSignatureError:
#             return jsonify({'message': 'Token has expired'}), 401
#         except jwt.InvalidTokenError:
#             return jsonify({'message': 'Invalid token'}), 401

#         return f(*args, **kwargs)
#     return decorated


# Register blueprints
app.register_blueprint(iac_bp)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 7810))
    host = os.getenv('HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=True)