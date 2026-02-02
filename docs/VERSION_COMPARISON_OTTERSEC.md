# Version Comparison: Project vs OtterSec/solana-verifiable-build

## Our Project (Anchor.toml / Cargo.toml)

| Component | Version | Source |
|-----------|---------|--------|
| **anchor-lang** | 0.29.0 | `programs/age_registry/Cargo.toml` |
| **solana-program** | 1.17.31 | `programs/age_registry/Cargo.toml` |
| **Anchor CLI** | 0.29.0–0.30.1 | `Dockerfile.program` uses v0.29.0; `Dockerfile.anchor` uses backpackapp v0.30.1 |
| **Docker build** | `backpackapp/build:v0.28.0` or `v0.30.1` | `build-docker.sh`, `Dockerfile.program` |

## OtterSec / Ellipsis solana-verifiable-build

The `solana-verify` CLI (from crates.io, maintained by Ellipsis Labs/OtterSec) uses Docker images from **solanafoundation/solana-verifiable-build**. The image tag is chosen to match the **Solana** version in your program's dependencies.

| Component | Version | Source |
|-----------|---------|--------|
| **Solana** | 1.17.31 | `v1.17.31.Dockerfile` – matches our `solana-program =1.17.31` |
| **Rust** | From Solana's rust-toolchain.toml | Fetched per Solana release |
| **Anchor** | Not included | Base images have Rust + Solana only; no Anchor CLI |

## Compatibility

- **Solana version**: ✅ Match – both use 1.17.31.
- **Anchor**: The solana-verifiable-build base images do **not** include Anchor. For Anchor programs, `solana-verify verify-from-repo` typically runs `anchor build --verifiable` inside the container. The verification flow may use a different image or install Anchor at runtime; consult [solana-verifiable-build](https://github.com/Ellipsis-Labs/solana-verifiable-build) for Anchor-specific behavior.

## Recommendation

1. Build with `anchor build --verifiable` using our pinned toolchain (backpackapp or Dockerfile.program).
2. Deploy the resulting binary.
3. Run `solana-verify verify-from-repo` with `--mount-path packages/solana-age-registry` (Anchor workspace root).
4. If verification fails due to binary mismatch, ensure the deployed program was built with the same toolchain used for verification.
