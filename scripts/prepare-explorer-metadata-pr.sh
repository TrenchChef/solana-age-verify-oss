#!/usr/bin/env bash
# Prepares content for Solana Explorer project-metadata.json PR.
# Usage: ./scripts/prepare-explorer-metadata-pr.sh
# Then: fork solana-labs/explorer, add the entry, open PR.
#
# Note: The Solana Explorer repo structure may have changed. Program metadata
# is now fetched from OtterSec (verify.osec.io) when the verified build is
# registered. If project-metadata.json no longer exists, the verified build
# registration (Task 1) is the primary path for Explorer visibility.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNIPPET="$SCRIPT_DIR/../docs/explorer-metadata-snippet.json"

echo "=== Solana Explorer Metadata PR ==="
echo ""
echo "1. Fork https://github.com/solana-labs/explorer"
echo "2. Clone your fork and create branch:"
echo "   git clone https://github.com/YOUR_USERNAME/explorer.git"
echo "   cd explorer"
echo "   git checkout -b add-ageverify-metadata"
echo ""
echo "3. Locate project-metadata.json (path may vary; check src/ or app/)"
echo "   Add this entry (maintain alphabetical order by program ID):"
echo ""
cat "$SNIPPET"
echo ""
echo "4. Commit and push:"
echo "   git add <path-to-project-metadata.json>"
echo "   git commit -m 'Add Solana Age Verify program metadata'"
echo "   git push origin add-ageverify-metadata"
echo ""
echo "5. Open PR at https://github.com/solana-labs/explorer/compare"
echo "   Title: Add Solana Age Verify program metadata"
echo "   Description: Program ID AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q, website https://ageverify.live"
echo ""
