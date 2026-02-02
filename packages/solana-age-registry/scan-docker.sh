#!/usr/bin/env bash
# Run Soteria security scan inside Docker (does not change canonical build per IMMUTABLES).
# From repo root: ./packages/solana-age-registry/scan-docker.sh
# From packages/solana-age-registry: ./scan-docker.sh
# Builds image from Dockerfile.soteria (requires supercompiler.xyz reachable). If build fails, use CI or try from another network.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
WORKSPACE_ROOT="$(cd ../.. && pwd)"
IMAGE_NAME="${SOTERIA_IMAGE:-age-registry-soteria}"

echo "Building Soteria image (one-time; requires supercompiler.xyz)..."
docker build -t "$IMAGE_NAME" -f docker/Dockerfile.soteria . || {
  echo "Build failed: supercompiler.xyz may be unreachable. Try CI (GitHub Actions) or run from another network."
  exit 1
}

echo "Running Soteria -analyzeAll in packages/solana-age-registry..."
docker run --rm \
  -v "$WORKSPACE_ROOT:/workspace" \
  -w /workspace/packages/solana-age-registry \
  "$IMAGE_NAME"
