#!/usr/bin/env bash
# Local verification: same gates as CI before push to main (triggers Vercel redeploy).
# 1) Dockerized Anchor/IDL build — only when there are program or IDL changes (set SKIP_ANCHOR_BUILD=1 to skip when only SDK or web changed).
# 2) SDK build (solana-age-verify)
# 3) Web app / Oracle build (@talkchain/web)
# Run from repo root: ./scripts/verify-local.sh
# After this commit: Anchor/IDL build is required only when packages/solana-age-registry, Anchor.toml, or IDL-related files change.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${SKIP_ANCHOR_BUILD:-}" != "1" ]]; then
  echo "[verify-local] 1/3 Dockerized Anchor build..."
  docker-compose run --rm builder /bin/bash -c "export PATH=\"/root/.local/share/solana/install/active_release/bin:\$PATH\" && anchor build"
else
  echo "[verify-local] 1/3 Dockerized Anchor build (skipped, SKIP_ANCHOR_BUILD=1)"
fi

echo "[verify-local] 2/3 SDK build..."
pnpm --filter solana-age-verify build

echo "[verify-local] 3/3 Web app / Oracle build..."
pnpm --filter @talkchain/web build

echo "[verify-local] All gates passed. Safe to push (CI will repeat these steps)."
