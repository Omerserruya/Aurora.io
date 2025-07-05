# Aurora.io

A microservices-based web application that provides user authentication and management capabilities.

## Overview

Aurora.io is a modern web application built with a microservices architecture. It includes user authentication, user management, and a responsive frontend interface. The application utilizes Docker containers for consistent deployment and Nginx as an API gateway to manage service communication.

## Architecture

The application follows a microservices architecture with the following components:

- **Frontend**: React-based user interface
- **Authentication Service**: Handles user authentication and authorization
- **User Management Service**: Manages user data and profiles
- **Nginx**: Acts as API gateway and reverse proxy
- **Shared Modules**: Common code shared between services

```
┌─────────────┐      ┌─────────────────┐
│   Browser   │─────▶│      Nginx      │
└─────────────┘      │   (API Gateway) │
                     └────────┬────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
        ┌────────▼─────────┐      ┌────────▼─────────┐
        │  Auth Service    │      │ User Management  │
        │    (Node.js)     │◀────▶│     Service      │
        └──────────────────┘      └──────────────────┘
```

## Services

### Frontend
- **Technology**: React.js
- **Purpose**: User interface for the application
- **Port**: 3000 (dev) / 80, 443 (production via Nginx)
- [Frontend Documentation](./frontend/README.md)

### Auth Service
- **Technology**: Node.js, Express, JWT
- **Purpose**: Handles authentication and authorization
- **Port**: 4002
- [Auth Service Documentation](./authService/README.md)

### User Management Service
- **Technology**: Node.js, Express, MongoDB
- **Purpose**: Manages user data and profiles
- **Port**: 4001
- [User Management Documentation](./userMgmntService/README.md)

### Nginx
- **Technology**: Nginx
- **Purpose**: API Gateway, reverse proxy, static file serving
- **Port**: 80 (HTTP), 443 (HTTPS)
- [Nginx Documentation](./nginx/README.md)

### Shared Modules
- **Purpose**: Common code shared between services
- [Shared Modules Documentation](./shared/README.md)

## Setup and Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 14+ (for local development)
- MongoDB (automatically provided via Docker)

### Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Aurora.io.git
   cd Aurora.io
   ```

2. For local development:
   bash```
   docker compose -f ./docker-compose-dev.yml up --build
   ```

   This will start all services in development mode with hot reloading.

3. Access the application:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:80
   - Direct service access (dev only):
     - User Management: http://localhost:4001
     - Auth Service: http://localhost:4002

## Environment Configuration

Each service has its own environment configuration file:

- Auth Service: `authService/.env.dev` and `authService/.env.prod`
- User Management: `userMgmntService/.env.dev` and `userMgmntService/.env.prod`
- Frontend: Environment variables in `docker-compose.yml`

## Development Workflow

1. Make changes to service code
2. Services will automatically reload changes
3. For frontend changes, access the React development server at http://localhost:3000
4. For backend changes, test via the Nginx gateway at http://localhost or directly via service ports

## Production Deployment

For production deployment:

1. Set all environment files to production versions
2. Configure proper HTTPS in Nginx
3. Build production Docker images:
   ```
   docker-compose -f docker-compose.yml build
   docker-compose -f docker-compose.yml up -d
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add appropriate license information here]
