# Cloud Architecture Chatbot Service

This service provides an AI-powered chatbot that can answer questions about cloud architecture, with a focus on AWS environments.

## Features

- RAG (Retrieval-Augmented Generation) system using the Model Control Plane (MCP)
- Leverages Google's Gemini 1.5 Flash model through the MCP service
- Pure API service focused solely on user interaction
- Acts as a thin client to the MCP service which handles all data retrieval and model interactions
- Support for AWS cloud environments
- Context-aware responses based on user's cloud infrastructure

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

### Process Query

```
POST /api/chatbot/query/:userId/:connectionId
Content-Type: application/json

{
  "prompt": "What EC2 instances do I have in my environment?"
}
```

Where:
- `:userId` - The ID of the user whose cloud data should be used
- `:connectionId` - The ID of the specific cloud connection to query

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
2. Forwards the request to the MCP service
3. The MCP service:
   - Retrieves the user's cloud infrastructure data from the db-service
   - Formats this data into context for the RAG system
   - Sends the query and context to the Gemini API
   - Returns the AI-generated response
4. The chatbot returns the response to the user

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

# Query
curl -X POST http://localhost:4005/api/chatbot/query/user123/conn-abc123 \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What AWS resources do I have?"}'
``` 