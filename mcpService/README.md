# Model Control Plane (MCP) Service

The MCP (Model Control Plane) Service is a crucial component of the Aurora.io platform that provides a centralized interface for AI model interactions.

## Purpose

The MCP service serves as an abstraction layer between the client applications and AI models/data sources, providing:

1. **Centralized Model Management**: A single service to handle all AI model interactions
2. **Context Retrieval and Formatting**: Fetches relevant data from various data sources and formats it for models
3. **Standardized Interfaces**: Consistent APIs for applications to use, regardless of the underlying model
4. **Model Agnostic Architecture**: Support for multiple AI providers with the ability to switch models easily

## Architecture

The MCP Service follows a layered architecture:

```
┌─────────────────────┐
│ Client Applications │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│     MCP Service     │
├─────────────────────┤
│   Model Provider    │
├─────────────────────┤
│    Context Layer    │
├─────────────────────┤
│     Data Access     │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│    Data Services    │
└─────────────────────┘
```

### Key Components

1. **Model Providers**: 
   - Currently supports Gemini 1.5 Flash
   - Uses a provider interface that can be extended to support other models

2. **Context Service**:
   - Retrieves and formats context from various data sources
   - Manages data adapters for different types of information

3. **Data Adapters**:
   - CloudDataAdapter: Retrieves cloud architecture data
   - (Extensible for other data sources)

## API Endpoints

- `POST /api/mcp/query` - Process a user query with context
- `GET /api/mcp/health` - Health check endpoint

## Environment Variables

Required environment variables:
- `PORT` - Port to run the service on (default: 4006)
- `NODE_ENV` - Environment (development, production)
- `GEMINI_API_KEY` - API key for Google's Gemini model
- `DB_SERVICE_URL` - URL for the database service

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production mode
npm start
```

## Docker

The service is containerized and can be run with Docker:

```bash
# Build the Docker image
docker build -t aurora/mcp-service .

# Run the container
docker run -p 4006:4006 -e GEMINI_API_KEY=your_api_key aurora/mcp-service
```

## Docker Compose

The service is integrated into the Aurora.io platform via Docker Compose. See the root `docker-compose.yml` for the complete configuration. 