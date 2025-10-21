FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --production

COPY --from=builder /app ./

EXPOSE 4000

CMD ["node", "dist/index.js"]
