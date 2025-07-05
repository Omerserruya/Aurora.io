# Frontend

## Overview

This directory contains the frontend React application for Aurora.io. The frontend provides a modern user interface for interacting with the Aurora.io services, including user authentication, profile management, and other features.

## Technologies

- React.js
- React Router for navigation
- Axios for API requests
- Material UI for styling
- Redux and Redux Toolkit for state management
- Redux Persist for persistent state
- Docker for containerization

## Features

- User registration and login
- OAuth login with Google and GitHub
- User profile management
- Avatar upload functionality
- Responsive design
- Protected routes for authenticated users
- Role-based access control

## Architecture

The frontend follows a modern React application architecture:
- Component-based UI structure
- React hooks for state management
- Redux for global state management
- Axios for API communication
- React Router for client-side routing

### State Management

The application uses Redux for global state management:
- Redux Toolkit for simplified Redux setup and usage
- Redux Persist for persisting state across browser sessions
- Slices for managing different parts of the state (user, account, search)
- Compatibility hooks for smooth transition from Context API to Redux

#### Redux Store Structure

```
store/
├── index.ts               # Root store configuration and persistor
├── hooks.ts               # Typed hooks for accessing Redux state
└── slices/                # Redux slices
    ├── userSlice.ts       # User authentication and profile state
    ├── accountSlice.ts    # Account management state
    └── searchSlice.ts     # Search functionality state
```

#### Compatibility Layer

The application includes a compatibility layer that allows components to use Redux through hooks that have the same interface as the previous Context API hooks:

```
hooks/
├── compatibilityHooks.ts  # Exports hooks with Context API-compatible interfaces
├── useReduxUser.ts        # Hook for user state
├── useReduxAccount.ts     # Hook for account state
└── useReduxSearch.ts      # Hook for search state
```

### Communication with Backend Services

The frontend communicates with backend services through:
- Nginx API Gateway at `/api/*` endpoints
- Direct access to service endpoints during development

## Setup and Configuration

### Environment Variables

The frontend uses the following environment variables:

```
REACT_APP_API_URL=http://localhost
NODE_ENV=development
```

In production:
```
REACT_APP_API_URL=https://your-production-domain.com
NODE_ENV=production
```

## Running the Application

### With Docker Compose
The frontend is designed to run as part of the full Aurora.io application using Docker Compose:

```bash
# From the project root
docker compose build
docker compose up
```

### Standalone for Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App (not recommended)

## File Structure

```
frontend/
├── public/                # Static files
│   ├── index.html        # HTML template
│   └── favicon.ico       # Favicon
├── src/                  # Source files
│   ├── components/       # React components
│   ├── consts/           # Constants and configuration
│   ├── hooks/            # Custom React hooks and compatibility hooks
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── store/            # Redux store configuration and slices
│   ├── styles/           # Styled components and themes
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main App component
│   └── index.tsx         # Entry point
├── .env                  # Environment variables
├── Dockerfile            # Docker configuration
└── package.json          # NPM dependencies and scripts
```

## Key Components

### Authentication

The frontend handles authentication by:
- Storing JWT tokens in HTTP-only cookies
- Checking authentication status on protected routes
- Refreshing tokens automatically when needed
- Redirecting to login when authentication fails
- Storing user data in Redux with persistence

### API Integration

API requests are centralized in service files:
- `authService.js`: Authentication-related API calls
- `userService.js`: User-related API calls

Example API call:
```javascript
// Example from authService.js
export const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

## Routing

Protected routes are implemented using React Router:

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/profile" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Routes>
```

## Docker Configuration

The frontend is containerized using the following Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

In Docker Compose, the frontend service is configured with:
- Volume mounts for code and node_modules
- Environment variables
- A shared volume for the build output with Nginx
