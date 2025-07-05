from flask import Flask
from flask_cors import CORS
import os
from src.routes.iac import iac_bp

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Register blueprints
app.register_blueprint(iac_bp)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 7810))
    host = os.getenv('HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=True)