# Transaction Flows (Immutable When Working)

**Rule:** When a flow works in production, it is **immutable**. Do not change order, steps, or contracts without an explicit decision and an update to this document (and any referenced specs).

**Sources:** docs/HOW_AGE_VERIFICATION_WORKS.md, docs/INTEGRATION_GUIDE.md, docs/specs/IMMUTABLES.md, packages/age-verify-sdk (worker load → verify → fee → oracle).

---

## 1. Biometric load flow (SDK worker)

1. Integrator calls `verifyHost18Plus` with `workerFactory` (e.g. `() => new AgeWorker()`).
2. SDK sends `LOAD_MODELS` to worker with `basePath` (e.g. `/models` or integrator’s public path).
3. Worker loads models: face detection (Sensor-D / MediaPipe), liveness (`m_05.bin` / LogicCore), age/landmark models as required. WASM/WebGPU fallback per implementation; load must succeed or worker responds `ERROR` — no silent skip (IMMUTABLES §5).
4. Worker responds `LOADED` when all required models are ready.
5. If load fails, verification does not start; caller receives clear error.

For the load-path test (and local/dev) to pass, `m_05.bin` and WASM assets must be available at `basePath` (e.g. `/models`). Use `scripts/setup-dev-assets.sh` or `scripts/download-models.sh` as needed.

**Invariant:** Biometrics load at all times and never fail/corrupt (IMMUTABLES §5). No verification step runs without successful load.

---

## 2. Verification flow (user-facing)

1. **Load** — Models loaded in worker (see §1). User sees “ready” or error.
2. **Camera** — Camera stream started; user grants permission.
3. **Face detection & geometric analysis** — Face and landmarks detected (6 key points).
4. **Directional liveness** — User performs challenges (e.g. look left, nod). Prevents photo/video replay.
5. **Texture analysis** — Passive liveness (skin vs screen/paper).
6. **Age estimation** — Model outputs age/confidence. Decision: over18 or not.
7. **Face hash** — Deterministic hash from landmarks; no raw image leaves device.
8. **Protocol fee** — User (or sponsor) signs 0.0005 SOL to Protocol Treasury (`vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi`). Fee tx submitted to chain.
9. **On-chain** — Program records verification in a PDA derived from the user wallet (Program ID `AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q`).
10. **Oracle issuance** — Oracle observes chain and issues SAS credential (`AgeVerificationCredential_v2`) to user wallet. Oracle never returns private key (IMMUTABLES §4).

**Invariants:** Protocol Treasury, Program ID, Gatekeeper, validity (180d adults, 90d minors), zero PII on-chain (IMMUTABLES §§2–4).

---

## 3. Fee flow

- **Protocol fee:** 0.0005 SOL (500,000 lamports), fixed, to Protocol Treasury. Required for each successful verification.
- **App fee:** Set by integrator; paid to App Treasury.
- **Oracle/rent/gas:** ~0.001 SOL; paid by user or sponsor.
- **Total:** Protocol + App + Oracle/network. No change to Protocol fee or treasury without explicit decision and update to IMMUTABLES.md.

---

## 4. Oracle flow

- Client completes verification and on-chain step (fee + program write).
- Oracle watches chain; verifies transaction and program state.
- Oracle signs and issues SAS credential.
- Oracle **never** returns private signing key to the client (IMMUTABLES §4).

---

## Changing a flow

1. Document current behavior and proposed change.
2. Get explicit decision (e.g. Architect, DECISIONS_LOG).
3. Update this document and any referenced specs (IMMUTABLES, IDL, etc.).
4. Preserve keypairs and env variables unless the decision explicitly changes them.
