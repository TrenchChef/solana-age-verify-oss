#!/bin/bash

# build-docker.sh
# Purpose: Run Anchor build inside a stable Docker container to resolve toolchain conflicts.

# Get the absolute path of the workspace root (parent of packages/solana-age-registry)
WORKSPACE_ROOT=$(cd ../../ && pwd)
PROGRAM_DIR=$(pwd)

echo "🚀 Building Docker image 'age-registry-builder'..."
docker build -t age-registry-builder -f docker/Dockerfile.program .

echo "🛠️  Running Build inside Container..."
# We mount the entire workspace root so that the vendor directory and local paths work
# We mount to /app but the sub-path /app/packages/solana-age-registry will be where the command runs
docker run --rm \
    -v "$WORKSPACE_ROOT:/app" \
    -w "/app/packages/solana-age-registry" \
    age-registry-builder \
    bash -c "export CARGO_TARGET_DIR=/tmp/anchor-target && mkdir -p /tmp/anchor-target && rm -f Cargo.lock && anchor idl upgrade --provider.cluster devnet --filepath onchain_idl_upgrade.json AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q && mkdir -p target && cp -r /tmp/anchor-target/* target/"

echo "✅ Build Complete. Check target/deploy and target/idl."
