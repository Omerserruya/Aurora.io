# Shared Modules

## Overview

This directory contains shared modules that are used across multiple services in the Aurora.io application. By centralizing these common components, we ensure code reusability, maintainability, and consistency across services.

## Modules

### Authentication Middleware

`authMiddleware.ts`: A shared middleware for authenticating requests using JWT tokens.

```typescript
// Example usage:
import { authentification } from '@shared/authMiddleware';

// Apply to protected routes
router.put('/:id', authentification, userController.updateUser);
```

## Usage

The shared modules are mounted into each service container using Docker Compose volumes:

```yaml
volumes:
  - ./shared:/app/shared
```

And imported in TypeScript files using path aliases configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["./shared/*"]
    }
  }
}
```

## Adding New Shared Modules

When adding new shared modules:

1. Place the module in this directory
2. Export the necessary functions/classes/interfaces
3. Import in services using the `@shared` path alias
4. Update this README to document the new module

## Deployment

No special deployment steps are needed for shared modules. They are automatically included in the services via Docker volume mounts.

## Future Considerations

In the future, this shared code could be:

1. Published as an internal NPM package
2. Moved to a monorepo setup with proper package dependencies
3. Split into multiple specialized packages (e.g., auth, validation, types)

This would provide better versioning and dependency management as the project grows. 