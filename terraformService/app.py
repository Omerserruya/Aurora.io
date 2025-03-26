from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from src.routes.iac import iac_bp

# load_dotenv('.env.development')

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(iac_bp)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 7810))
    host = os.getenv('HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=True)