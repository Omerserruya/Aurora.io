# Cloud Architecture Chatbot Service

This service provides an AI-powered chatbot that can answer questions about cloud architecture, with a focus on AWS environments.

## Features

- RAG (Retrieval-Augmented Generation) system using the Model Control Plane (MCP)
- Leverages Google's Gemini 1.5 Flash model through the MCP service
- Pure API service focused solely on user interaction
- Acts as a thin client to the MCP service which handles all data retrieval and model interactions
- Support for AWS cloud environments
- Context-aware responses based on user's cloud infrastructure
- Authentication with JWT tokens for secure access

## Prerequisites

- Node.js (v18+)
- Docker and Docker Compose (for running with the full stack)
- Google Gemini API key

## Environment Configuration

Create or modify the `.env.development` file with the following variables:

```
PORT=4005
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
DB_SERVICE_URL=http://db-service:4003
MCP_SERVICE_URL=http://mcp-service:4006
JWT_KEY=your_jwt_secret_key
```

For production, create a `.env` file with similar configuration.

## Running the Service

### With Docker Compose (recommended)

The easiest way to run the service is with Docker Compose:

```bash
# Start the service (along with the other services)
docker-compose up -d chatbot-service

# Check logs
docker-compose logs -f chatbot-service
```

### Standalone Development

For development purposes, you can run the service standalone:

```bash
npm install
npm run dev
```

## API Endpoints

### Health Check

```
GET /api/chatbot/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "chatbot-service",
  "dependencies": {
    "mcp": "healthy"
  },
  "timestamp": "2023-05-01T00:00:00.000Z"
}
```

### Process Query

```
POST /api/chatbot/query/:userId/:connectionId
```

**Authentication:**
- Requires a valid JWT token in either:
  - Cookie: `accessToken`
  - Header: `Authorization: Bearer <token>`

**URL Parameters:**
- `userId` - The ID of the user whose cloud data should be used
- `connectionId` - The ID of the specific cloud connection to query

**Request Body:**
```json
{
  "prompt": "What EC2 instances do I have in my environment?"
}
```

**Success Response:**
```json
{
  "response": "You have 5 EC2 instances in your environment. These include 3 t2.micro instances running your web application tier, and 2 c5.large instances running your application servers. All instances are located in the us-east-1 region and are associated with your 'web-app' security group. Feel free to ask if you'd like to know more details about these instances!"
}
```

**Error Response:**
```json
{
  "response": "Failed to retrieve infrastructure data",
  "type": "error"
}
```

**Authentication Error:**
```json
{
  "message": "Auth failed: No credentials were given"
}
```

## Conversation Support (Coming Soon)

We're planning to add conversation history support to maintain context across multiple queries. This will include:

1. Session management for persistent conversations
2. Context tracking across multiple questions
3. New endpoints for managing conversations:
   - `/api/chatbot/session/create/:userId` - Create a new conversation session
   - `/api/chatbot/session/:sessionId/history` - Retrieve conversation history
   - `/api/chatbot/query/:userId/:connectionId/:sessionId?` - Query with optional session context

## Running the Demo

We've created a demo script that showcases the capabilities of the chatbot. It will:

1. Create sample AWS data for a demo user
2. Run a series of queries to demonstrate the different types of questions it can answer
3. Test direct connectivity to the Gemini API

To run the demo:

```bash
./demo.sh
```

### Sample Demo Queries

The demo includes the following sample queries:

- "What AWS resources do I have in my environment?"
- "Tell me about my VPC and subnet configuration."
- "What security measures are implemented in my AWS environment?"
- "What are some security improvements I should consider for my AWS infrastructure?"
- "How many EC2 instances do I have and what type are they?"
- "How is my database configured?"

## Architecture

The chatbot service works as follows:

1. Receives a query from the user along with their userId
2. Validates authentication via JWT token
3. Forwards the request to the MCP service
4. The MCP service:
   - Retrieves the user's cloud infrastructure data from the db-service
   - Formats this data into context for the RAG system
   - Sends the query and context to the Gemini API
   - Returns the AI-generated response
5. The chatbot returns the response to the user

This architecture provides several benefits:
- Clear separation of concerns: Chatbot service is now a thin client focused only on API handling
- All data retrieval and formatting is centralized in the MCP service
- Extensibility: New model providers and data sources can be added without changing the chatbot service
- Maintainability: Clear boundaries between components make the system easier to maintain

## Testing

To test the service, you can use curl or any API client:

```bash
# Health check
curl http://localhost:4005/api/chatbot/health

# Query (with JWT token)
curl -X POST http://localhost:4005/api/chatbot/query/user123/conn-abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"prompt": "What AWS resources do I have?"}'

# Or query using cookie authentication (typically from a browser)
curl -X POST http://localhost:4005/api/chatbot/query/user123/conn-abc123 \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN" \
  -d '{"prompt": "What AWS resources do I have?"}'
```

## Integration with Frontend

To integrate with the frontend, make requests to:

```
http://localhost/api/chatbot/query/:userId/:connectionId
```

The Nginx reverse proxy will handle routing the request to the chatbot service and passing along authentication cookies. 