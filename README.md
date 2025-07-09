# 🌟 Aurora.io - Cloud Infrastructure Visualization & Management Platform

<div align="center">

![Aurora.io](./frontend/public/aurora-light.png)

**🚀 Modern Cloud Infrastructure Visualization • 🤖 AI-Powered Architecture Assistant • ☁️ Multi-Cloud Management**

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)](https://neo4j.com/)

</div>

---

## 📋 Project Overview

Aurora.io is a comprehensive cloud infrastructure visualization and management platform designed to revolutionize how developers and DevOps teams interact with their cloud architectures. Built with a modern microservices architecture, Aurora.io combines real-time cloud resource visualization, AI-powered recommendations, and Infrastructure as Code (IaC) generation capabilities into a single, intuitive platform.

The platform addresses critical challenges in cloud infrastructure management by providing interactive visualization tools that allow users to design, understand, and manage their AWS architectures visually. Aurora.io's AI assistant, powered by Google's Gemini AI, offers intelligent recommendations, troubleshooting assistance, and architectural guidance, making complex cloud infrastructure accessible to teams of all expertise levels. The platform's unique capability to export visual designs directly to Terraform configurations bridges the gap between visual design and deployment automation.

Aurora.io features secure multi-account AWS integration, real-time resource synchronization, and collaborative workspace management. The platform's microservices architecture ensures scalability and maintainability, with each service handling specific functionality: authentication, user management, cloud querying, AI processing, email communications, and Infrastructure as Code generation. The system leverages both MongoDB for document storage and Neo4j for graph-based relationship mapping, enabling sophisticated resource dependency tracking and network topology visualization.

Built for academic research, enterprise deployment, and educational purposes, Aurora.io demonstrates modern software engineering practices including containerization, API gateway patterns, reactive frontend architectures, and cloud-native design principles, making it an ideal platform for studying distributed systems and cloud infrastructure management.

---

## 🏗️ Architecture Overview

Aurora.io implements a **microservices architecture** with the following core components:

```
┌─────────────────┐     ┌─────────────────────────────────────────┐
│    Frontend     │────▶│                Nginx                     │
│   (React/TS)    │     │           (API Gateway)                  │
└─────────────────┘     └─────────────┬───────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
┌───────▼────────┐           ┌────────▼────────┐          ┌────────▼────────┐
│ Auth Service   │◀─────────▶│ User Management │◀────────▶│  DB Service     │
│   (JWT/OAuth)  │           │    Service      │          │ (MongoDB/Neo4j) │
└────────────────┘           └─────────────────┘          └─────────────────┘
        │                             │                             │
        │                    ┌────────▼────────┐          ┌────────▼────────┐
        └───────────────────▶│ Chatbot Service │◀────────▶│ Cloud Query     │
                             │   (AI/Gemini)   │          │    Service      │
                             └─────────────────┘          └─────────────────┘
                                      │                             │
                             ┌────────▼────────┐          ┌────────▼────────┐
                             │  MCP Service    │          │ Terraform       │
                             │ (Model Provider)│          │    Service      │
                             └─────────────────┘          └─────────────────┘
                                      │
                             ┌────────▼────────┐
                             │  Mail Service   │
                             │   (MJML/SMTP)   │
                             └─────────────────┘
```

---

## 🛠️ Services & Technologies

### 🎨 **Frontend Service**
- **Technology**: React.js 18+ with TypeScript, Material-UI, Redux Toolkit
- **Purpose**: Interactive cloud architecture visualization and user interface
- **Features**: 
  - 🎯 Drag-and-drop AWS resource design
  - 📊 Real-time infrastructure visualization
  - 🔧 Resource configuration panels
  - 📱 Responsive design for all devices
- **Port**: `3000` (development) / `80`, `443` (production)

### 🔐 **Authentication Service**
- **Technology**: Node.js, Express.js, Passport.js, JWT
- **Purpose**: Secure user authentication and authorization
- **Features**:
  - 🔑 JWT-based authentication
  - 🌐 OAuth integration (GitHub, Google)
  - 🛡️ Session management
  - 🔒 Role-based access control
- **Port**: `4002`

### 👥 **User Management Service**
- **Technology**: Node.js, Express.js, MongoDB, Multer
- **Purpose**: User profile and account management
- **Features**:
  - 👤 User profile management
  - 📁 File upload handling
  - 📧 Email verification
  - 👑 Admin user management
- **Port**: `4001`

### 💾 **Database Service**
- **Technology**: Node.js, MongoDB, Neo4j, GraphQL
- **Purpose**: Centralized data management and graph relationships
- **Features**:
  - 📊 MongoDB for document storage
  - 🕸️ Neo4j for resource relationships
  - 🔐 Data encryption
  - 📈 Resource metrics storage
- **Port**: `4003`

### ☁️ **Cloud Query Service**
- **Technology**: Node.js, Docker, Python CloudQuery
- **Purpose**: Real-time AWS resource discovery and synchronization
- **Features**:
  - 🔄 Real-time AWS resource scanning
  - 🐳 Containerized query execution
  - 🔗 Multi-account support
  - 📡 Secure credential management
- **Port**: `4004`

### 🤖 **Chatbot Service**
- **Technology**: Node.js, Socket.io, Google Gemini AI
- **Purpose**: AI-powered architecture assistant and recommendations
- **Features**:
  - 💬 Real-time chat interface
  - 🧠 AI-powered recommendations
  - 🔧 Troubleshooting assistance
  - 📋 Architecture best practices
- **Port**: `4005`

### 🎯 **MCP Service (Model Content Provider)**
- **Technology**: Node.js, Google Gemini AI
- **Purpose**: Centralized AI model management and content generation
- **Features**:
  - 🤖 AI model orchestration
  - 📝 Content generation
  - 🔄 Context management
  - 📊 Feedback processing
- **Port**: `4006`

### 📧 **Mail Service**
- **Technology**: Node.js, MJML, Brevo/SendInBlue
- **Purpose**: Transactional email notifications and templates
- **Features**:
  - 📮 Welcome emails
  - 🔐 Password reset notifications
  - 📋 Admin notifications
  - 🎨 HTML email templates
- **Port**: `4007`

### 🏗️ **Terraform Service**
- **Technology**: Python, Flask, Terraform
- **Purpose**: Infrastructure as Code generation and export
- **Features**:
  - 📄 Terraform configuration generation
  - 🗺️ Resource mapping
  - 📥 IaC export functionality
  - ✅ Configuration validation
- **Port**: `7810`

### 🌐 **Nginx (API Gateway)**
- **Technology**: Nginx Alpine
- **Purpose**: Reverse proxy, load balancing, and static file serving
- **Features**:
  - 🔄 Request routing
  - 📁 Static file serving
  - 🛡️ SSL termination
  - ⚖️ Load balancing
- **Port**: `80` (HTTP), `443` (HTTPS)

### 🗄️ **Database Systems**
- **MongoDB**: Document storage for user data, configurations, and metrics
- **Neo4j**: Graph database for resource relationships and network topology

---

## 🚀 Quick Start Guide

### 📋 Prerequisites

Before getting started, ensure you have the following installed:

- 🐳 **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
- 🟢 **Node.js** (version 18+) - for local development
- 🔧 **Git** - for cloning the repository
- 💾 **8GB+ RAM** recommended for optimal performance

### 🔧 Environment Setup

 1. **📥 Clone the Repository**
    ```bash
    git clone https://github.com/[username]/Aurora.io.git
    cd Aurora.io
    ```

2. **🔑 Environment Configuration**
   
   Create the following environment files:

   **📄 `.env` (Root directory)**
   ```bash
   # Database Configuration
   MONGODB_URL=mongodb://mongodb:27017/aurora
   NEO4J_URL=bolt://neo4j:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=<your_neo4j_password>
   
   # Service Ports
   PORT_AUTH=4002
   PORT_USERS=4001
   PORT_DB=4003
   PORT_CLOUD=4004
   PORT_CHATBOT=4005
   PORT_MCP=4006
   PORT_MAIL=4007
   PORT_TF=7810
   
   # Security
   JWT_SECRET_KEY=<your_jwt_secret_key>
   JWT_REFRESH_KEY=<your_jwt_refresh_key>
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   ENCRYPTION_KEY=<your_32_character_encryption_key>
   
   # External APIs
   GEMINI_API_KEY=<your_gemini_api_key>
   GITHUB_CLIENT_ID=<your_github_client_id>
   GITHUB_CLIENT_SECRET=<your_github_client_secret>
   GOOGLE_CLIENT_ID=<your_google_client_id>
   GOOGLE_CLIENT_SECRET=<your_google_client_secret>
   
   # Email Service (Brevo/SendInBlue)
   BREVO_USER=<your_brevo_username>
   BREVO_PASS=<your_brevo_password>
   FROM_EMAIL=<your_from_email>
   
   # Cloud Query Configuration
   QUERY_IMAGE=aurora/cloud-query:latest
   VALIDATE_IMAGE=aurora/validate:latest
   QUERY_NETWORK=query-network
   
   # Development Configuration
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ENV_URL=http://localhost:80
   ```

3. **🔐 OAuth Configuration** (Optional)
   
   For GitHub OAuth:
   - Visit [GitHub Developer Settings](https://github.com/settings/developers)
   - Create a new OAuth App
   - Set callback URL: `http://localhost:80/auth/github/callback`
   
   For Google OAuth:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Set callback URL: `http://localhost:80/auth/google/callback`

---

## 🏃‍♂️ Running the Application

### 🔄 Development Mode

For development with hot reloading and debugging:

```bash
# Start all services in development mode
docker-compose -f docker-compose-dev.yml up --build

# Or start specific services
docker-compose -f docker-compose-dev.yml up frontend auth-service users-service
```

**🌐 Development Access Points:**
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:80
- **MongoDB**: http://localhost:27017
- **Neo4j Browser**: http://localhost:7474
- **Individual Services**: http://localhost:400X (where X is service number)

### 🚀 Production Mode

For production deployment:

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Scale specific services
docker-compose up --scale chatbot-service=3 -d
```

**🌐 Production Access:**
- **Application**: http://localhost or your domain
- **HTTPS**: Configure SSL certificates in nginx configuration

### 🧹 Cleanup

To stop and remove all containers:

```bash
# Stop all services
docker-compose down

# Remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Clean up Docker system
docker system prune -a
```

---

## 📚 Development Workflow

### 🛠️ Local Development Setup

1. **📥 Install Dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install service dependencies (optional for Docker development)
   cd ../authService && npm install
   cd ../userMgmntService && npm install
   # ... repeat for other services
   ```

2. **🔄 Hot Reloading**
   
   Development mode enables hot reloading for:
   - ⚛️ Frontend: React Hot Reload
   - 🔧 Backend Services: nodemon auto-restart
   - 📁 Volume mounting for live code changes

3. **🧪 Testing**
   ```bash
   # Run service-specific tests
   cd authService && npm test
   cd userMgmntService && npm test
   
   # Run frontend tests
   cd frontend && npm test
   ```

   4. **📊 Database Management**
      ```bash
      # MongoDB shell access
      docker exec -it aurora_mongodb mongosh aurora
      
      # Neo4j browser
      # Open http://localhost:7474
      # Use the credentials from your .env file
      ```

### 🐛 Debugging

1. **📋 Service Logs**
   ```bash
   # View all service logs
   docker-compose logs -f
   
   # View specific service logs
   docker-compose logs -f chatbot-service
   docker-compose logs -f auth-service
   ```

2. **🔍 Health Checks**
   ```bash
   # Check service health
   docker-compose ps
   
   # Test individual service endpoints
   curl http://localhost:4002/  # Auth service
   curl http://localhost:4003/health  # DB service
   ```

3. **🐳 Container Debugging**
   ```bash
   # Execute shell in container
   docker exec -it aurora_auth-service bash
   docker exec -it aurora_frontend sh
   ```

---

## 🔧 Configuration

### 🌍 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | ✅ |
| `JWT_SECRET_KEY` | JWT signing secret | - | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | - | ✅ |
| `MONGODB_URL` | MongoDB connection string | `mongodb://mongodb:27017/aurora` | ✅ |
| `NEO4J_URL` | Neo4j connection string | `bolt://neo4j:7687` | ✅ |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | ✅ |

### 📁 File Structure

```
Aurora.io/
├── 🎨 frontend/              # React TypeScript frontend
├── 🔐 authService/           # Authentication microservice
├── 👥 userMgmntService/      # User management microservice
├── 💾 dbService/             # Database abstraction layer
├── ☁️ cloudQueryService/     # AWS resource discovery
├── 🤖 chatbotService/        # AI chatbot service
├── 🎯 mcpService/            # Model content provider
├── 📧 mailService/           # Email notification service
├── 🏗️ terraformService/      # Infrastructure as Code
├── 🌐 nginx/                 # API gateway configuration
├── 🔧 shared/                # Shared utilities and middleware
├── 🐳 images/                # Docker images for cloud querying
└── 📋 docker-compose*.yml    # Container orchestration
```

---

## 📖 API Documentation

### 🔗 Service Endpoints

| Service | Base URL | Documentation |
|---------|----------|---------------|
| 🔐 Authentication | `/auth` | JWT, OAuth, session management |
| 👥 User Management | `/users` | Profile, settings, admin operations |
| 💾 Database | `/db` | Resource data, metrics, relationships |
| ☁️ Cloud Query | `/cloud` | AWS resource discovery, connectivity |
| 🤖 Chatbot | `/chat` | AI conversations, recommendations |
| 🎯 MCP | `/mcp` | AI model operations, content generation |
| 📧 Mail | `/mail` | Email notifications, templates |
| 🏗️ Terraform | `/terraform` | IaC generation, export operations |

### 🔑 Authentication

Aurora.io uses JWT-based authentication with refresh tokens:

 ```javascript
 // Login request
 POST /auth/login
 {
   "email": "user@example.com",
   "password": "<user_password>"
 }

 // Response
 {
   "token": "<jwt_access_token>",
   "refreshToken": "<jwt_refresh_token>",
   "user": { ... }
 }
 ```

---

## 🧪 Testing

### 🔬 Unit Tests

```bash
# Run all service tests
npm run test:all

# Run specific service tests
cd authService && npm test
cd userMgmntService && npm test
cd chatbotService && npm test
```

### 🌐 Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up --build

# Run integration tests
npm run test:integration
```

### 🚀 End-to-End Tests

```bash
# Start application
docker-compose up -d

# Run E2E tests
cd frontend && npm run test:e2e
```

---

## 📊 Monitoring & Observability

### 📈 Health Monitoring

All services include health check endpoints:

```bash
# Check service health
curl http://localhost:80/health

# Individual service health
curl http://localhost:4003/health  # DB Service
curl http://localhost:4005/health  # Chatbot Service
```

### 📋 Logging

Centralized logging with structured JSON format:

```bash
# View aggregated logs
docker-compose logs -f

# Filter by service
docker-compose logs -f chatbot-service | grep ERROR
```

---