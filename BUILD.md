# Production Build Guide

This project uses Docker for immutable, hermetic builds of all components. This ensures that Mainnet deployments are reproducible and free from local toolchain interference.

**Preserve keypairs and env variables:** When building, modifying, or replacing any component, keep the same keypairs and env variables. Do not rotate Program ID, Gatekeeper, or treasury keys without an explicit decision and update to .SECRET_VAULT.md / docs/specs/IMMUTABLES.md. Use existing .env and secrets; do not overwrite.

**Anchor/IDL build only when there are changes:** The Anchor program and IDL build runs only when the program or Anchor config changes. Locally use `SKIP_ANCHOR_BUILD=1 ./scripts/verify-local.sh` when only SDK or web changed. **CI** (`.github/workflows/ci.yml`): path filter runs the Anchor build only when `packages/solana-age-registry/Anchor.toml` or `packages/solana-age-registry/programs/age_registry/**` change; IDL is cached and restored so when the build is skipped the restored `target/` (including `target/idl/`) is used for downstream steps.

## 1. Anchor Program & IDL

The Anchor program (`solana-age-registry`) is built using a strict Docker container with pre-installed Rust, Solana, and Anchor binaries matching our `Anchor.toml` version (0.30.1).

**Build Command:**
```bash
cd packages/solana-age-registry
./build-docker.sh
```

**Artifacts:**
- Program Binary: `target/deploy/age_registry.so`
- Keypair: `target/deploy/age_registry-keypair.json`
- IDL: `target/idl/age_registry.json`

## 2. Web SDK

The SDK (`solana-age-verify`) is built in a Node.js container to ensure clean dependency resolution and TypeScript compilation.

**Build Command:**
```bash
docker build -t age-verify-sdk-builder -f packages/age-verify-sdk/Dockerfile .
```

To extract artifacts:
```bash
docker run --rm -v $(pwd)/packages/age-verify-sdk/dist:/out age-verify-sdk-builder cp -r /app/packages/age-verify-sdk/dist/* /out
```

## 3. Web App / Oracle

The Web App (which includes the Oracle API at `/api`) is built as a production-ready container.

**Build Command:**
```bash
docker build -t age-verify-web-builder -f apps/web/Dockerfile .
```

**Deployment:**
For Vercel, the source is pushed to GitHub. For containerized hosting, use the image `age-verify-web-builder`.

## 4. Verification

Before deployment, ensure that:
1. `age_registry.json` (IDL) is generated.
2. Program ID in `IDL` matches `.SECRET_VAULT.md`.
3. SDK builds without type errors.

## 5. Solscan Program Verification (security.txt, verified build, logo)

The program includes **security.txt** (contacts, policy, source) and is ready for verified-build registration and Solscan branding.

**After deploying an upgraded program:**

1. **Reproducible build verification (Option B)** – Compare local build to on-chain program using our pinned toolchain:
   ```bash
   ./scripts/verify-build-reproducible.sh mainnet   # or devnet
   ```
   Builds with `backpackapp/build:v0.30.1` + Anchor 0.29.0, then compares SHA-256 to the deployed program. No `anchor build --verifiable` required.

2. **Verifiable build and deploy** (run in an environment with Anchor CLI and Solana toolchain):
   ```bash
   cd packages/solana-age-registry
   anchor build --verifiable
   anchor deploy --provider.cluster devnet   # or mainnet when ready
   ```

3. **Register verified build** with OtterSec (repo must be public on GitHub). After pushing your code and deploying:
   ```bash
   cargo install solana-verify
   COMMIT=$(git rev-parse HEAD)
   solana-verify verify-from-repo \
     --program-id AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q \
     --library-name age_registry \
     --mount-path packages/solana-age-registry \
     --commit-hash "$COMMIT" \
     -u https://api.devnet.solana.org \
     -y \
     https://github.com/YOUR_GITHUB_ORG/solana-age-verify
   ```
   Replace `YOUR_GITHUB_ORG` with your GitHub org or username. For mainnet use `-u https://api.mainnet-beta.solana.org`.

4. **Request program logo on Solscan** (no public form for programs): join [Solscan Discord](https://discord.gg/VYdtu92DX3), request program labeling/branding, and provide Program ID `AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q`, project name **AgeVerify**, logo (PNG, e.g. 256×256), website, and proof of ownership (sign with upgrade authority).
