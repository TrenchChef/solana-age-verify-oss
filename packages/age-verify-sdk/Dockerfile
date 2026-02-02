# Build the SDK library
FROM node:18-alpine

WORKDIR /app

# Copy package.json files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/age-verify-sdk/package.json ./packages/age-verify-sdk/

# We need to copy unrelated packages to satisfy workspace lookup if pnpm uses it,
# but for safety we'll assume standard pnpm install can handle workspace
COPY packages/solana-age-registry/package.json ./packages/solana-age-registry/
COPY apps/web/package.json ./apps/web/

# Install dependencies (ignoring scripts to avoid toolchain issues)
RUN npm install -g pnpm && pnpm install --frozen-lockfile --ignore-scripts

# Copy SDK Source
COPY packages/age-verify-sdk ./packages/age-verify-sdk

# Build SDK
WORKDIR /app/packages/age-verify-sdk
RUN npm run build
