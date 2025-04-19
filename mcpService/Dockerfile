FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port
EXPOSE 4006

# Start the service
CMD ["node", "dist/index.js"] 