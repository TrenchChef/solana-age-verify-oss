#!/usr/bin/env bash
# Register verified build with OtterSec (Solscan "Program is verified" badge).
# Requires: Docker running, solana-verify installed (cargo install solana-verify)
# Run from OSS repo root (clone: https://github.com/TrenchChef/solana-age-verify-oss)
# Usage: ./scripts/verify-build-mainnet.sh

set -euo pipefail

REPO_URL="https://github.com/TrenchChef/solana-age-verify-oss"
COMMIT="${COMMIT:-$(git rev-parse HEAD)}"
PROGRAM_ID="AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q"
MOUNT_PATH="packages/solana-age-registry"

echo "Verifying program $PROGRAM_ID at commit $COMMIT"
echo "Repo: $REPO_URL"
echo "Mount path: $MOUNT_PATH"
echo ""
echo "Ensure Docker is running before continuing."
read -p "Press Enter to continue or Ctrl+C to abort..."

solana-verify verify-from-repo \
  --program-id "$PROGRAM_ID" \
  --library-name age_registry \
  --mount-path "$MOUNT_PATH" \
  --commit-hash "$COMMIT" \
  -u https://api.mainnet-beta.solana.com \
  -y \
  "$REPO_URL"

echo ""
echo "If successful, Solscan will show 'Program is verified' within a few minutes."
