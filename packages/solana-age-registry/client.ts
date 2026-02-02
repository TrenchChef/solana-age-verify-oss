import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

export function getVerificationRecordPda(programId: PublicKey, wallet: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("verification"), wallet.toBuffer()],
        programId
    );
}

export async function buildCreateVerificationTx(
    program: anchor.Program,
    wallet: PublicKey,
    payer: PublicKey,
    protocolTreasury: PublicKey,
    appTreasury: PublicKey,
    gatekeeper: PublicKey,
    facehash: number[],
    verifiedAt: number,
    over18: boolean,
    appFee: number
) {
    const [pda] = getVerificationRecordPda(program.programId, wallet);
    return program.methods
        .createVerification(
            facehash,
            new anchor.BN(verifiedAt),
            over18,
            new anchor.BN(appFee)
        )
        .accounts({
            verificationRecord: pda,
            authority: wallet,
            payer,
            protocolTreasury,
            appTreasury,
            gatekeeper,
            systemProgram: SystemProgram.programId,
        })
        .transaction();
}

export async function buildUpdateVerificationTx(
    program: anchor.Program,
    wallet: PublicKey,
    payer: PublicKey,
    protocolTreasury: PublicKey,
    appTreasury: PublicKey,
    gatekeeper: PublicKey,
    facehash: number[],
    verifiedAt: number,
    over18: boolean,
    appFee: number
) {
    const [pda] = getVerificationRecordPda(program.programId, wallet);
    return program.methods
        .updateVerification(
            facehash,
            new anchor.BN(verifiedAt),
            over18,
            new anchor.BN(appFee)
        )
        .accounts({
            verificationRecord: pda,
            authority: wallet,
            payer,
            protocolTreasury,
            appTreasury,
            gatekeeper,
            systemProgram: SystemProgram.programId,
        })
        .transaction();
}

export async function buildCloseVerificationTx(
    program: anchor.Program,
    wallet: PublicKey,
    payer: PublicKey
) {
    const [pda] = getVerificationRecordPda(program.programId, wallet);
    return program.methods
        .closeVerification()
        .accounts({
            verificationRecord: pda,
            authority: wallet,
            payer,
        })
        .transaction();
}

export async function fetchVerification(program: anchor.Program, wallet: PublicKey) {
    const [pda] = getVerificationRecordPda(program.programId, wallet);
    return program.account.verificationRecord.fetch(pda);
}
