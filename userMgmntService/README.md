# User Management Service

## Overview

The User Management Service handles all user data operations for the Aurora.io application. It is responsible for creating, retrieving, updating, and deleting user accounts, as well as handling user profile information and avatar uploads. This service provides a RESTful API that is used by both the frontend and other backend services.

## Technologies

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose ORM
- Bcrypt for password hashing
- Multer for file uploads
- Docker for containerization

## Features

- Complete user CRUD operations
- Secure password hashing
- User profile with avatar uploads
- Role-based user types (user/admin)
- Secure internal service APIs for authentication service
- RESTful API design

## Architecture

The User Management Service follows a microservices approach:
- It is the single source of truth for user data
- It provides both public APIs and internal service APIs
- It manages file storage for user avatars
- It is consumed by the Auth Service for authentication operations

### Communication with Other Services

The User Management Service:
- Provides internal endpoints for the Auth Service
- Stores and manages all user data including tokens

## API Documentation

### Public Endpoints

| Method | Path          | Description                     | Request Body                       | Response                           |
|--------|---------------|---------------------------------|------------------------------------|--------------------------------------|
| POST   | /add          | Create a new user               | `{username, email, password, role}`| Created user object                  |
| GET    | /             | Get all users                   | none                               | Array of user objects                |
| GET    | /:id          | Get user by ID                  | none                               | User object or 404                   |
| PUT    | /:id          | Update user                     | User fields to update              | Updated user object                  |
| DELETE | /:id          | Delete user                     | none                               | Success message                      |
| POST   | /:id/avatar   | Upload user avatar              | Form data with avatar file         | Success with avatar URL              |

### Internal Service Endpoints

These endpoints require the `X-Internal-Service: true` header and are used by the Auth Service:

| Method | Path                  | Description                           | Request Body/Parameters              |
|--------|---------------------|---------------------------------------|-------------------------------------|
| GET    | /findByEmail/:email   | Find user by email                    | Email as path parameter              |
| POST   | /validatePassword     | Validate password against hash        | `{password, hashedPassword}`         |
| PUT    | /:id/token            | Add token to user                     | `{token}`                            |
| DELETE | /:id/token/:token     | Remove token from user                | Token as path parameter              |
| GET    | /:id/verifyToken/:token | Verify if token exists for user     | Token as path parameter              |
| PUT    | /:id/updateToken      | Update token for user                 | `{oldToken, newToken}`               |

### Example Requests

#### Create a New User
```http
POST /add HTTP/1.1
Host: localhost:4001
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user"
}
```

#### Upload User Avatar
```http
POST /123456/avatar HTTP/1.1
Host: localhost:4001
Content-Type: multipart/form-data
Authorization: Bearer your_access_token

[Binary file data]
```

#### Find User by Email (Internal)
```http
GET /findByEmail/john@example.com?includePassword=true HTTP/1.1
Host: localhost:4001
X-Internal-Service: true
```

## Environment Configuration

The service requires the following environment variables:

```
PORT=4001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aurora
PROFILE_UPLOAD_PATH=/app/uploads/users
```

## Running the Service

### With Docker Compose
The User Management Service is designed to run as part of the full Aurora.io application using Docker Compose:

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

# Run tests
npm test
```

## File Structure

```
userMgmntService/
├── src/
│   ├── controllers/         # Controller logic
│   │   └── user_controller.ts  # User management controller
│   │   └── user_controller.ts  # User management controller
│   ├── routes/              # API routes
│   │   └── user_route.ts    # User management routes
│   ├── models/              # Model definitions
│   │   └── user_model.ts    # User model definition
│   ├── app.ts               # Express application setup
│   └── server.ts            # Server initialization
├── uploads/                 # Upload directory for avatars
├── .env.dev                 # Development environment variables
├── .env.production          # Production environment variables
├── Dockerfile               # Docker configuration
├── package.json             # NPM dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Database Schema

### User Collection

```javascript
{
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    select: false,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  githubId: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    required: false
  },
  likedPosts: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: [String],
    default: [],
    select: false
  }
}
```
