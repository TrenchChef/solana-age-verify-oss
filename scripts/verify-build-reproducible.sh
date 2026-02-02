#!/usr/bin/env bash
# Option B: Reproducible build verification using our pinned toolchain.
# Builds with backpackapp/build:v0.30.1 + Anchor 0.29.0 (Dockerfile.program),
# then compares the binary hash to the on-chain program.
#
# Usage: ./scripts/verify-build-reproducible.sh [mainnet|devnet]
# Requires: Docker running, solana CLI configured
# Run from repo root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REGISTRY_DIR="$REPO_ROOT/packages/solana-age-registry"
PROGRAM_ID="AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q"
CLUSTER="${1:-mainnet}"

case "$CLUSTER" in
  mainnet) RPC_URL="https://api.mainnet-beta.solana.com" ;;
  devnet)  RPC_URL="https://api.devnet.solana.com" ;;
  *) echo "Usage: $0 [mainnet|devnet]"; exit 1 ;;
esac

echo "=== Reproducible Build Verification (Option B) ==="
echo "Program ID: $PROGRAM_ID"
echo "Cluster: $CLUSTER ($RPC_URL)"
echo ""

# 1. Build with our pinned toolchain (backpackapp/build:v0.30.1)
echo "[1/4] Building with backpackapp/build:v0.30.1 + Anchor 0.30.1..."
cd "$REGISTRY_DIR"
docker run --rm \
  -v "$REPO_ROOT:/workspace" \
  -w /workspace/packages/solana-age-registry \
  -e CARGO_TARGET_DIR=/workspace/packages/solana-age-registry/target \
  backpackapp/build:v0.30.1 \
  anchor build --no-idl

if [[ ! -f "$REGISTRY_DIR/target/deploy/age_registry.so" ]]; then
  echo "ERROR: Build failed - age_registry.so not found"
  exit 1
fi

LOCAL_SHA=$(shasum -a 256 "$REGISTRY_DIR/target/deploy/age_registry.so" | awk '{print $1}')
echo "Local build SHA-256: $LOCAL_SHA"
echo ""

# 2. Dump on-chain program
echo "[2/4] Fetching on-chain program..."
DUMP_FILE=$(mktemp -t age_registry_onchain.XXXXXX.so)
solana program dump "$PROGRAM_ID" "$DUMP_FILE" -u "$RPC_URL" 2>/dev/null || {
  echo "ERROR: Failed to dump on-chain program. Is solana CLI configured? Try: solana config set --url $RPC_URL"
  rm -f "$DUMP_FILE"
  exit 1
}

ONCHAIN_SHA=$(shasum -a 256 "$DUMP_FILE" | awk '{print $1}')
echo "On-chain program SHA-256: $ONCHAIN_SHA"
echo ""

# 3. Compare
echo "[3/4] Comparing hashes..."
rm -f "$DUMP_FILE"

if [[ "$LOCAL_SHA" == "$ONCHAIN_SHA" ]]; then
  echo "[4/4] MATCH: Local build matches on-chain program."
  echo ""
  echo "The deployed program was built with the same toolchain (backpackapp/build:v0.30.1 + Anchor 0.29.0)."
  exit 0
else
  echo "[4/4] MISMATCH: Local build does not match on-chain program."
  echo ""
  echo "Possible causes:"
  echo "  - On-chain program was built with a different toolchain"
  echo "  - Source code has changed since deployment"
  echo "  - Run 'anchor upgrade' to deploy the current build"
  exit 1
fi
