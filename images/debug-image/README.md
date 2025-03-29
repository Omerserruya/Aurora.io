# Debug Image for Cloud Query Service

This is a simple debug image that prints all environment variables and exits. It's useful for testing the cloud query service's container management functionality.

## Building the Image

```bash
docker build -t query-runner:debug .
```

## Usage

The image can be used with the cloud query service by setting the `DOCKER_IMAGE` environment variable to `query-runner:debug`.

### Example Environment Variables

For validation:
```bash
userID=test-user
AWS_ACCESS_KEY_ID=test-key
AWS_SECRET_ACCESS_KEY=test-secret
AWS_REGION=us-east-1
```

For query:
```bash
userID=test-user
```

## Expected Output

The container will:
1. Print all environment variables in sorted order
2. Wait for 5 seconds
3. Exit with status code 0

## Testing with Cloud Query Service

1. Build the debug image
2. Update the service's `.env` file:
   ```
   DOCKER_IMAGE=query-runner:debug
   ```
3. Run the service and test the endpoints:
   - POST /api/validate
   - POST /api/query
   - GET /api/status 