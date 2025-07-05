FROM node:18-alpine AS base

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

FROM base AS development

RUN npm install --save-dev ts-node nodemon 

CMD ["npx", "nodemon", "src/app.ts"]

FROM base AS production

# Build TypeScript code
RUN npm run build

COPY src/templates ./dist/templates
# Note: No EXPOSE directive - internal service only
# Service runs on port 4007 internally within Docker network

# Start the service
CMD ["node", "dist/app.js"] 