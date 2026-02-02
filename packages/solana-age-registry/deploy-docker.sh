#!/bin/bash

# deploy-docker.sh
# Purpose: Run Anchor deploy inside the Docker container to ensure toolchain consistency.

# Get the absolute path of the workspace root (parent of packages/solana-age-registry)
WORKSPACE_ROOT=$(cd ../../ && pwd)

echo "🚀 Deploying to Devnet via Docker..."

# Note: We assume the 'build-docker.sh' has already run and populated the 'target' directory locally.
# We mount the workspace so the container can see the 'target' directory and the 'keys' directory.

docker run --rm \
    -v "$WORKSPACE_ROOT:/app" \
    -w "/app/packages/solana-age-registry" \
    age-registry-builder-v2 \
    anchor deploy --program-name age_registry --provider.cluster devnet --provider.wallet ../../keys/Ch3FHmuLmrL1FeHsoibsCYsFMtY67zbjkZK13VdkZtHC.json --program-keypair ../../keys/AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q.json
