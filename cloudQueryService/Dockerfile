FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .


FROM base AS development

RUN npm install --save-dev ts-node nodemon 

CMD ["npx", "nodemon", "src/app.ts"]


FROM base AS production
# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 4004

# Start the service
CMD ["npm", "start"] 