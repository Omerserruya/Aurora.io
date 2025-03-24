# Auth Service

## Overview

The Auth Service handles all authentication and authorization related operations for the Aurora.io application. It is responsible for user registration, login, token management, and OAuth integration with third-party providers like Google and GitHub.

## Technologies

- Node.js
- Express
- TypeScript
- JWT for token management
- Axios for communication with User Service
- Passport.js for OAuth strategies
- Docker for containerization

## Features

- User registration and login
- JWT-based authentication with access and refresh tokens
- OAuth integration with Google and GitHub
- Secure token storage and management
- Token refresh mechanism
- Stateless architecture for scalability

## Architecture

The Auth Service follows a microservices approach:
- It communicates with the Users Service to manage user data
- It handles authentication logic independently
- It issues and validates JWT tokens for API access

### Communication with Other Services

The Auth Service relies on the Users Service for:
- Creating new users during registration
- Retrieving user information for authentication
- Storing and validating refresh tokens
- Verifying user credentials

## API Documentation

### Authentication Endpoints

| Method | Path          | Description                     | Request Body                       | Response                           |
|--------|---------------|---------------------------------|------------------------------------|--------------------------------------|
| POST   | /register     | Register a new user             | `{username, email, password, role}`| User object or error                |
| POST   | /login        | Authenticate and get tokens     | `{email, password}`                | User info with tokens as cookies     |
| POST   | /logout       | Invalidate tokens               | none (uses cookies)                | Success message                      |
| POST   | /refresh      | Refresh access token            | none (uses refresh token cookie)   | New tokens as cookies                |
| GET    | /current      | Get current authenticated user  | none (uses access token cookie)    | User information                     |
| GET    | /test         | Test authentication             | none (uses access token cookie)    | Success message with user ID         |

### OAuth Endpoints

| Method | Path          | Description                     | Query Parameters                   | Response                           |
|--------|---------------|---------------------------------|------------------------------------|--------------------------------------|
| GET    | /google       | Start Google OAuth flow         | none                               | Redirects to Google                  |
| GET    | /github       | Start GitHub OAuth flow         | none                               | Redirects to GitHub                  |
| GET    | /callback     | OAuth callback route            | OAuth provider data                | Redirects with user information      |

### Example Requests

#### Register a New User
```http
POST /register HTTP/1.1
Host: localhost:4002
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user"
}
```

#### Login
```http
POST /login HTTP/1.1
Host: localhost:4002
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Authentication Flow

1. **Registration**:
   - Client sends user details to `/register`
   - Auth service forwards request to Users service
   - New user is created and returned

2. **Login**:
   - Client sends credentials to `/login`
   - Auth service validates credentials with Users service
   - On success, JWT tokens (access + refresh) are set as HTTP-only cookies

3. **API Access**:
   - Client includes cookies in subsequent requests
   - Access token is validated by Auth middleware
   - When access token expires, refresh token is used to get a new one

4. **Logout**:
   - Client calls `/logout`
   - Refresh token is invalidated in the database
   - Cookies are cleared

## Environment Configuration

The service requires the following environment variables:

```
PORT=4002
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aurora
JWT_KEY=your_jwt_secret_key
JWT_REFRESH_KEY=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
USER_SERVICE_URL=http://users-service:4001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
CALLBACK_URL=http://localhost/auth/callback
```

## Running the Service

### With Docker Compose
The Auth Service is designed to run as part of the full Aurora.io application using Docker Compose:

```bash
# From the project root
docker compose build
docker compose up
```

### Standalone for Development
```bash
# Install dependencies
npm install

# Start in development mode
npm run devstart

# Start in production mode
npm run prodstart
```

## File Structure

```
authService/
├── src/
│   ├── controllers/         # Controller logic
│   │   └── auth_controller.ts  # Authentication controller
│   ├── routes/              # API routes
│   │   └── auth_route.ts    # Authentication routes
│   ├── models/              # Model definitions (removed, now uses Users Service)
│   ├── app.ts               # Express application setup
│   └── server.ts            # Server initialization
├── .env.dev                 # Development environment variables
├── .env.production          # Production environment variables
├── Dockerfile               # Docker configuration
├── package.json             # NPM dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

# Node.js Project with MongoDB in Dev Container

This project is set up to run a Node.js application with MongoDB using a development container. Follow the instructions below to set up your environment and run the project.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [VS Code](https://code.visualstudio.com/) with the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension (optional but recommended)

## Getting Started

1. **Open the Dev Container for Node.js and MongoDB**:

   - Open VS Code, navigate to **Remote - Containers** and open the **Node.js and MongoDB** Dev Container.
   - VS Code should prompt you to reopen the project in this container environment, allowing it to build and initialize with Node.js and MongoDB.

2. **Clone the Repository**:

   Once inside the dev container, clone the repository:

   ```bash
   git clone https://github.com/Omerserruya/AdvancedWeb.git
   cd AdvancedWeb
   ```


## Important: Environment Variables

> [!WARNING] 
> 
> **ALERT: Create a `.env` File**

Before running the project, you must create a `.env` file in the root directory. This file should contain the following environment variables:

```plaintext
PORT = replace_this_with_number_port             # or any port number you prefer
MONGODB_URL = "mongodb://your_mongo_db"
```


- PORT: The port on which your Node.js application will run.
- MONGODB_URL: The connection URL for your MongoDB database.

> [!NOTE]
> Ensure the .env file is added to your .gitignore to prevent it from being tracked by version control for security purposes.

**Install dependencies**

Before running the project, you must insttall all dependencies by the next command:
```bash 
npm install
```

**Running the Application**

Once the environment is set up, you can start the application by running:

```bash 
npm start
```


**For Testing the Rest API**

install the ```REST CLIENT``` VS Code Extention
