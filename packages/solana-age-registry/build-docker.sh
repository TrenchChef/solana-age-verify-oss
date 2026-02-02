#!/bin/bash
# Build Anchor program using backpackapp/build:v0.28.0
# This image has:
# - Anchor CLI 0.28.0 (compatible with anchor-lang 0.29.0)
# - Cargo 1.70.0 (avoids edition2024 issues)
# - Solana CLI 1.16.0
set -euo pipefail
cd "$(dirname "$0")"

IMAGE_NAME="backpackapp/build:v0.28.0"
WORKSPACE_ROOT=$(cd ../.. && pwd)

echo "Building age_registry with $IMAGE_NAME..."

# Generate lockfile with compatible dependency versions
# (downgrade cc, jobserver, blake3 to avoid edition2024 transitive deps)
docker run --rm \
    -v "$WORKSPACE_ROOT:/workspace" \
    -w /workspace/packages/solana-age-registry/programs/age_registry \
    "$IMAGE_NAME" \
    bash -c '
        if [ ! -f Cargo.lock ]; then
            cargo generate-lockfile
            cargo update -p cc --precise 1.1.11
            cargo update -p jobserver --precise 0.1.31
            cargo update -p blake3 --precise 1.5.0
        fi
    '

# Build the SBF program
docker run --rm \
    -v "$WORKSPACE_ROOT:/workspace" \
    -w /workspace/packages/solana-age-registry/programs/age_registry \
    "$IMAGE_NAME" \
    cargo-build-sbf --sbf-out-dir=/workspace/packages/solana-age-registry/target/deploy

echo ""
echo "Build complete!"
ls -la target/deploy/age_registry.so 2>/dev/null && echo "Size: $(stat -f%z target/deploy/age_registry.so 2>/dev/null || stat -c%s target/deploy/age_registry.so 2>/dev/null) bytes"
