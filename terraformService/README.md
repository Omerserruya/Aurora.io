# Terraform Service

A Flask-based service for managing Terraform operations.

## Project Structure

```
terraformService/
├── src/
│   └── routes/
│       ├── __init__.py
│       ├── iac.py         # Base IaC routes
│       └── terraform.py   # Terraform-specific routes
├── app.py                 # Main application
├── requirements.txt
└── .env.development
```

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
   - Copy `.env.development` to `.env` if you want to use different settings
   - The default port is set to 7810 in `.env.development`

## Running the Server

To run the development server:
```bash
python app.py
```

The server will start on `http://localhost:7810` (or the port specified in your .env file)

## Available Endpoints

### Base Endpoints
- `GET /`: Welcome message
- `GET /health`: Health check endpoint

### Infrastructure as Code (IaC) Endpoints
- `GET /iac`: Base IaC API information
- `GET /iac/status`: Current status of IaC services

### Terraform Endpoints
- `GET /iac/terraform`: Terraform service information and available operations
- `POST /iac/terraform/plan`: Initiate a Terraform plan operation
- `POST /iac/terraform/apply`: Initiate a Terraform apply operation

## Development

The server runs in debug mode by default, which enables auto-reload when code changes are detected. 