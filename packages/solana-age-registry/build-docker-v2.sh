#!/bin/bash
#
# build-docker-v2.sh
# Purpose: Build Anchor program in Docker using the same toolchain,
#          with a pinned toolchain.

set -euo pipefail

# Get the absolute path of the workspace root (parent of packages/solana-age-registry)
WORKSPACE_ROOT=$(cd ../../ && pwd)

# Match program Cargo.toml (anchor-lang 0.29.0); v2 image has newer Rust/Cargo for edition2024 deps
ANCHOR_VERSION="${ANCHOR_VERSION:-0.29.0}"

echo "🚀 Building Docker image 'age-registry-builder-v2' (Anchor ${ANCHOR_VERSION})..."
docker build --build-arg ANCHOR_VERSION="${ANCHOR_VERSION}" \
    -t age-registry-builder-v2 \
    -f docker/Dockerfile.program.v2 .

echo "🛠️  Running build (v2 container, newer Rust/Cargo)..."
docker run --rm \
    -v "$WORKSPACE_ROOT:/app" \
    -v age-registry-cargo-registry:/root/.cargo/registry \
    -v age-registry-cargo-git:/root/.cargo/git \
    -v age-registry-anchor-target-v2:/tmp/anchor-target \
    -w "/app/packages/solana-age-registry" \
    age-registry-builder-v2 \
    bash -c "rm -f programs/age_registry/Cargo.lock && export CARGO_TARGET_DIR=/tmp/anchor-target && export PATH=/root/.cargo/bin:\$PATH && anchor build && mkdir -p target && cp -r /tmp/anchor-target/* target/"

echo "✅ Build Complete. Check target/deploy and target/idl."
