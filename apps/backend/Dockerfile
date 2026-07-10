FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

# Copy monorepo configuration and workspace package definitions
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies (will install workspace dependencies as well)
RUN npm install

# Copy database package and generate Prisma Client
COPY packages/database ./packages/database
RUN npm run db:generate

# Copy backend app source code
COPY apps/backend ./apps/backend

EXPOSE 5000

CMD ["npm", "run", "dev", "--workspace=apps/backend"]
