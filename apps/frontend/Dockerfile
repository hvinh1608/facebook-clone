FROM node:18-alpine

WORKDIR /usr/src/app

# Copy monorepo configuration and workspace package definitions
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies (workspace scope)
RUN npm install

# Copy frontend app source code
COPY apps/frontend ./apps/frontend

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace=apps/frontend"]
