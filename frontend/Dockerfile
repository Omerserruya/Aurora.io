# Frontend Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM base AS development
CMD ["npm", "run", "start"]

FROM base AS production
RUN npm run build


# Output only the built files
# (Optional: You can skip this if we mount from /app/build directly)
