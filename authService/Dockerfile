FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt and native modules
RUN apk add --no-cache make gcc g++ python3 py3-pip

# Copy only package files first
COPY package*.json ./

# Install dependencies with specific flags for bcrypt
RUN npm install --build-from-source
RUN npm install --save-dev tsconfig-paths

# Copy source code but exclude node_modules
COPY . .

# Explicitly rebuild bcrypt to ensure it works with the current architecture
RUN npm rebuild bcrypt --build-from-source

EXPOSE 4002

CMD ["npm", "run", "devstart"] 