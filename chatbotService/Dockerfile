FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

FROM base AS development

RUN npm install --save-dev ts-node nodemon 

CMD ["npx", "nodemon", "src/app.ts"]

FROM base AS production

RUN npm run build

EXPOSE 4005

CMD ["npm", "start"] 