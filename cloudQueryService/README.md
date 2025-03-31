# Cloud Query Service

A TypeScript-based Node.js service for managing cloud query containers.

## Features

- Run validation containers with AWS credentials
- Execute query containers
- Track running containers
- Automatic container cleanup
- Docker network integration

## Prerequisites

- Node.js (v14 or higher)
- Docker
- Docker network named `query-network`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration.

4. Build the TypeScript code:
```bash
npm run build
```

## Running the Service

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### POST /api/validate
Validates AWS credentials by running a container with the provided credentials.

Request body:
```json
{
  "userID": "string",
  "awsCredentials": {
    "AWS_ACCESS_KEY_ID": "string",
    "AWS_SECRET_ACCESS_KEY": "string",
    "AWS_REGION": "string"
  }
}
```

### POST /api/query
Starts a query container with the provided user ID.

Request body:
```json
{
  "userID": "string"
}
```

### GET /api/status
Returns the number of currently running query containers.

Response:
```json
{
  "runningContainers": number
}
```

## Error Handling

The service includes comprehensive error handling and logging. All errors are logged using Winston logger and appropriate HTTP status codes are returned to the client.

## Docker Integration

The service uses Dockerode to manage containers. Containers are:
- Created with the specified environment variables
- Connected to the `query-network`
- Automatically removed after completion
- Monitored for output and exit status 