FROM node:18-alpine as base

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

FROM base as development

RUN npm install --save-dev ts-node nodemon 

CMD ["npx", "nodemon", "src/app.ts"]

FROM base as production

# Build TypeScript code
RUN npm run build

# Expose the port
EXPOSE 4006

# Start the service
CMD ["node", "dist/app.js"] 