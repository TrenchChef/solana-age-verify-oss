# Build the Web App (includes Oracle API)
FROM node:18-alpine

WORKDIR /app

# Copy lockfiles
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/age-verify-sdk/package.json ./packages/age-verify-sdk/
COPY packages/solana-age-registry/package.json ./packages/solana-age-registry/
COPY apps/web/package.json ./apps/web/
COPY tsconfig.base.json ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile --ignore-scripts

# Copy Source
COPY packages/age-verify-sdk ./packages/age-verify-sdk
COPY apps/web ./apps/web

# Build SDK (dependency)
WORKDIR /app/packages/age-verify-sdk
RUN npm run build

# Build Web/Oracle
WORKDIR /app/apps/web
RUN npm run build
