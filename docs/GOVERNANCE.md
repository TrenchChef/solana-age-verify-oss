# Governance & Security Architecture

This document outlines the governance structure for the Solana Age Verify protocol, specifically the implementation of the **Multi-Signature (Multisig)** Upgrade Authority to ensure defensibility and trust.

## 1. Overview: The "Upgrade Authority" vs. "Active Council"

It is critical to distinguish between the two roles partners play:

| Role | Mechanism | Frequency | Tool | Function |
| :--- | :--- | :--- | :--- | :--- |
| **Upgrade Authority** | **3-of-4 Multisig** | Rarely (Monthly) | **Squads Protocol** | Controls the `age_registry` program code. Can upgrade/freeze the program. **Paid per signature.** |
| **Active Council** (V2) | **Hot Wallets** | Frequently (Seconds) | Custom Listener | Signs individual user verification transactions in real-time. |

**This guide focuses on the Upgrade Authority setup (Phase 2 Requirement).**

---

## 2. Setting up the Squad (Upgrade Authority)

We use **Squads** (https://squads.so), the standard for Solana program management.

### Step 1: Acquire Partner Addresses
You must legally contact the partners to get their **Cold Storage / Multisig-Ready Public Keys**.
*Do NOT use their hot wallet addresses.*

| Member | Representative | Public Key (Placeholder) |
| :--- | :--- | :--- |
| **TalkChain (Lead)** | You | `Your_Cold_Wallet_Key` |
| **Helius** | Mert / Team | `...` |
| **Quicknode** | Team | `...` |
| **Security SME** | Team | `...` |

### Step 2: Create the Squad
1.  Go to **[Squads App](https://v4.squads.so)**.
2.  Connect your wallet (TalkChain Lead).
3.  **Create New Squad**:
    *   **Name:** `Solana Age Verify Governance`
    *   **Description:** `Upgrade Authority for the Age Verify Protocol.`
    *   **Voting Threshold:** **3-of-4** (Requires broad consensus, prevents single-party takeover).
4.  **Add Members**: Input the Public Keys acquired in Step 1.

### Step 3: Transfer Program Authority
Once the Squad is created, you must transfer the *Upgrade Authority* of the deployed program to the Squad's **Vault Address**.

**Command Line (Active Directory):**
```bash
# Get the Squad Vault address from the Dashboard (top left)
export SQUAD_VAULT="<SQUAD_VAULT_ADDRESS>"

# Set the upgrade authority to the Squad Vault
solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority $SQUAD_VAULT -k <CURRENT_DEPLOYER_KEY>
```

**Verification:**
Run `solana program show <PROGRAM_ID>` and confirm the `Authority` matches the `$SQUAD_VAULT`.

---

## 3. Governance Process (How to Upgrade)

When you need to deploy a new version (`age_registry_v2.so`):

1.  **Propose Upgrade:**
    *   TalkChain developer uploads the buffer: `solana program write-buffer ...`
    *   In Squads UI: Create a "Program Upgrade" proposal pointing to the new Buffer Address.
2.  **Notification:**
    *   Notify Helius/Quicknode via the private Telegram group.
    *   Provide the **Source Code Diff** and **Verifiable Build** hash.
3.  **Approval:**
    *   Partners review the diff.
    *   2 other partners confirm and sign the transaction in Squads.
4.  **Execution:**
    *   Once threshold (3/4) is reached, the transaction executes, and the program is upgraded on Mainnet.

## 4. Emergency Procedures

*   **Emergency Freeze:** If a critical bug is found, any **1 member** (or 2/4 depending on configuration) should be able to vote for a "Freeze" (requires pre-configuration in Squads V4).
*   **Key Rotation:** If a partner rotates their key, they must submit a proposal to remove their old key and add the new one, requiring 3/4 consensus.
