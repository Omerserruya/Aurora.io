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

## Detailed API Documentation

### 1. Process Query

```
POST /api/mcp/query
```

**Request Body:**
```json
{
  "prompt": "What EC2 instances do I have?",
  "userId": "67eb08297e84a3741381eb50",
  "connectionId": "67eb08772dbced4cc7eec905",
  "options": {
    "temperature": 0.2,
    "maxTokens": 2048
  }
}
```

**Required Fields:**
- `prompt` (string): The user's natural language query
- `userId` (string): The ID of the user whose cloud data should be used
- `connectionId` (string): The ID of the specific cloud connection to query

**Optional Fields:**
- `options` (object): Model generation options
  - `temperature` (number, 0.0-1.0): Controls randomness of the output
  - `maxTokens` (number): Maximum tokens to generate
  - `topP` (number, 0.0-1.0): Token sampling strategy
  - `topK` (number): Token sampling strategy

**Success Response:**
```json
{
  "response": "Based on your cloud infrastructure data, you have 5 EC2 instances in total. These include 3 t2.micro instances that are running your web application tier, and 2 c5.large instances that are handling your application processing workloads. All instances are currently in the 'running' state and are located in the us-east-1 region. Would you like to know more specific details about these instances, such as their launch dates or IP addresses?"
}
```

**Error Response:**
```json
{
  "response": "Failed to retrieve context data: No cloud data found for this user",
  "type": "error"
}
```

### 2. Health Check

```
GET /api/mcp/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "mcp-service",
  "providers": ["gemini"],
  "timestamp": "2023-05-01T00:00:00.000Z"
}
```

## Context Generation Process

The MCP service follows a systematic process to generate AI responses:

1. **Context Collection**:
   - Analyzes the user query to determine what data sources are relevant
   - Activates appropriate data adapters (e.g., CloudDataAdapter for AWS queries)
   - Retrieves user-specific cloud infrastructure data from the DB service

2. **Context Formatting**:
   - Organizes retrieved data into structured formats
   - Converts technical data into natural language descriptions
   - Prepares context in a format that maximizes model comprehension

3. **AI Generation**:
   - Constructs a prompt with system instructions, user query, and formatted context
   - Sends the complete prompt to the selected model provider (Gemini)
   - Receives and processes the response

4. **Response Delivery**:
   - Returns the AI-generated response to the calling service

## Model Provider Details

### Gemini 1.5 Flash

Currently, the MCP service uses Google's Gemini 1.5 Flash model with the following specifications:

- **Context Window**: 32,768 tokens
- **Generation Parameters**:
  - Default temperature: 0.1 (optimized for factual responses)
  - Default max output tokens: 2048
  - Top-p: 0.9
  - Top-k: 40

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

## Future Enhancements

1. **Additional Model Providers**:
   - OpenAI (GPT-4, Claude)
   - Local open-source models

2. **Expanded Data Sources**:
   - Azure and GCP cloud resources
   - Kubernetes cluster information
   - Application performance metrics

3. **Advanced Features**:
   - Conversation history and context persistence
   - Multi-turn conversations with memory
   - Proactive anomaly detection in cloud infrastructure 