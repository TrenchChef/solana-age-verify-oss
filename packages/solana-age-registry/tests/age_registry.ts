import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AgeRegistry } from "../target/types/age_registry";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import fs from "fs";

function loadKeypair(path: string): Keypair {
    const secret = JSON.parse(fs.readFileSync(path, "utf8")) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(secret));
}

describe("age_registry", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const program = anchor.workspace.AgeRegistry as Program<AgeRegistry>;
    const authority = provider.wallet;
    const gatekeeperPath = process.env.GATEKEEPER_KEYPAIR;
    const gatekeeperKeypair = gatekeeperPath ? loadKeypair(gatekeeperPath) : null;
    const protocolTreasury = gatekeeperKeypair ? gatekeeperKeypair.publicKey : PublicKey.default;

    const [verificationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verification"), authority.publicKey.toBuffer()],
        program.programId
    );

    before(function () {
        if (!gatekeeperKeypair) {
            this.skip();
        }
    });

    it("creates a verification record (over 18)", async () => {
        const facehash = Array(32).fill(1) as number[];
        const verifiedAt = new anchor.BN(Math.floor(Date.now() / 1000));
        const appFee = new anchor.BN(0);

        await program.methods
            .createVerification(facehash, verifiedAt, true, appFee)
            .accounts({
                verificationRecord: verificationPda,
                authority: authority.publicKey,
                payer: authority.publicKey,
                protocolTreasury,
                appTreasury: authority.publicKey,
                gatekeeper: gatekeeperKeypair!.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([gatekeeperKeypair!])
            .rpc();

        const account = await program.account.verificationRecord.fetch(verificationPda);
        expect(account.over18).to.be.true;
        expect(account.userCode).to.have.lengthOf(5);
    });

    it("rejects update while record is still valid", async () => {
        const facehash = Array(32).fill(2) as number[];
        const verifiedAt = new anchor.BN(Math.floor(Date.now() / 1000));
        const appFee = new anchor.BN(0);

        try {
            await program.methods
                .updateVerification(facehash, verifiedAt, true, appFee)
                .accounts({
                    verificationRecord: verificationPda,
                    authority: authority.publicKey,
                    payer: authority.publicKey,
                    protocolTreasury,
                    appTreasury: authority.publicKey,
                    gatekeeper: gatekeeperKeypair!.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([gatekeeperKeypair!])
                .rpc();
            expect.fail("Expected VerificationStillValid");
        } catch (e: any) {
            expect(e.message).to.contain("Verification is still valid");
        }
    });
});
