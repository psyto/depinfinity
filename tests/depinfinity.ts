import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DePINfinity } from "../target/types/depinfinity";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createMint,
    createAccount,
    mintTo,
} from "@solana/spl-token";
import { expect } from "chai";

describe("depinfinity", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.DePINfinity as Program<DePINfinity>;
    const provider = anchor.getProvider();

    // Test accounts
    let authority: Keypair;
    let user: Keypair;
    let mint: PublicKey;
    let rewardVault: PublicKey;
    let userTokenAccount: PublicKey;

    before(async () => {
        // Create test keypairs
        authority = Keypair.generate();
        user = Keypair.generate();

        // Airdrop SOL to test accounts
        await provider.connection.requestAirdrop(
            authority.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.requestAirdrop(
            user.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );

        // Create DOCOMO token mint
        mint = await createMint(
            provider.connection,
            authority,
            authority.publicKey,
            null,
            9 // 9 decimals
        );

        // Create reward vault
        rewardVault = await createAccount(
            provider.connection,
            authority,
            mint,
            authority.publicKey
        );

        // Create user token account
        userTokenAccount = await createAccount(
            provider.connection,
            user,
            mint,
            user.publicKey
        );

        // Mint tokens to reward vault
        await mintTo(
            provider.connection,
            authority,
            mint,
            rewardVault,
            authority,
            1000000000000 // 1000 tokens
        );
    });

    it("Initializes the program", async () => {
        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            program.programId
        );

        const tx = await program.methods
            .initialize()
            .accounts({
                programState: programStatePDA,
                authority: authority.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([authority])
            .rpc();

        console.log("Initialize transaction signature:", tx);

        // Verify program state
        const programState = await program.account.programState.fetch(
            programStatePDA
        );
        expect(programState.authority.toString()).to.equal(
            authority.publicKey.toString()
        );
        expect(programState.totalDevices.toNumber()).to.equal(0);
        expect(programState.totalRewardsDistributed.toNumber()).to.equal(0);
        expect(programState.isActive).to.be.true;
    });

    it("Registers a device", async () => {
        const deviceId = "test_device_001";
        const deviceType = { smartphone: {} };
        const location = {
            latitude: new anchor.BN(35676200000), // 35.6762 * 10^6
            longitude: new anchor.BN(139650300000), // 139.6503 * 10^6
            accuracy: new anchor.BN(100),
        };

        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                user.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            program.programId
        );

        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            program.programId
        );

        const tx = await program.methods
            .registerDevice(deviceId, deviceType, location)
            .accounts({
                device: devicePDA,
                programState: programStatePDA,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([user])
            .rpc();

        console.log("Register device transaction signature:", tx);

        // Verify device registration
        const device = await program.account.device.fetch(devicePDA);
        expect(device.owner.toString()).to.equal(user.publicKey.toString());
        expect(device.deviceId).to.equal(deviceId);
        expect(device.deviceType).to.deep.equal(deviceType);
        expect(device.isActive).to.be.true;
        expect(device.totalUptime.toNumber()).to.equal(0);
        expect(device.totalRewardsEarned.toNumber()).to.equal(0);
    });

    it("Submits network quality data and earns rewards", async () => {
        const deviceId = "test_device_001";
        const qualityData = {
            signalStrength: -65,
            latency: 50,
            throughput: new anchor.BN(1000000),
            availability: 0.95,
            location: {
                latitude: new anchor.BN(35676200000),
                longitude: new anchor.BN(139650300000),
                accuracy: new anchor.BN(100),
            },
        };

        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                user.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            program.programId
        );

        const [dataSubmissionPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("data"),
                devicePDA.toBuffer(),
                Buffer.from(Date.now().toString()),
            ],
            program.programId
        );

        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            program.programId
        );

        // Get initial token balance
        const initialBalance = await provider.connection.getTokenAccountBalance(
            userTokenAccount
        );

        const tx = await program.methods
            .submitData(qualityData)
            .accounts({
                device: devicePDA,
                dataSubmission: dataSubmissionPDA,
                programState: programStatePDA,
                rewardVault: rewardVault,
                userTokenAccount: userTokenAccount,
                user: user.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([user])
            .rpc();

        console.log("Submit data transaction signature:", tx);

        // Verify data submission
        const dataSubmission = await program.account.dataSubmission.fetch(
            dataSubmissionPDA
        );
        expect(dataSubmission.device.toString()).to.equal(devicePDA.toString());
        expect(dataSubmission.signalStrength).to.equal(
            qualityData.signalStrength
        );
        expect(dataSubmission.latency).to.equal(qualityData.latency);
        expect(dataSubmission.throughput.toString()).to.equal(
            qualityData.throughput.toString()
        );
        expect(dataSubmission.availability).to.equal(qualityData.availability);

        // Verify device stats updated
        const device = await program.account.device.fetch(devicePDA);
        expect(device.totalUptime.toNumber()).to.equal(1);
        expect(device.totalRewardsEarned.toNumber()).to.be.greaterThan(0);

        // Verify user received tokens
        const finalBalance = await provider.connection.getTokenAccountBalance(
            userTokenAccount
        );
        expect(parseInt(finalBalance.value.amount)).to.be.greaterThan(
            parseInt(initialBalance.value.amount)
        );
    });

    it("Updates device location", async () => {
        const deviceId = "test_device_001";
        const newLocation = {
            latitude: new anchor.BN(35680000000), // Updated coordinates
            longitude: new anchor.BN(139700000000),
            accuracy: new anchor.BN(50),
        };

        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                user.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            program.programId
        );

        const tx = await program.methods
            .updateLocation(newLocation)
            .accounts({
                device: devicePDA,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        console.log("Update location transaction signature:", tx);

        // Verify location update
        const device = await program.account.device.fetch(devicePDA);
        expect(device.location.latitude.toString()).to.equal(
            newLocation.latitude.toString()
        );
        expect(device.location.longitude.toString()).to.equal(
            newLocation.longitude.toString()
        );
        expect(device.location.accuracy.toString()).to.equal(
            newLocation.accuracy.toString()
        );
    });

    it("Toggles device status", async () => {
        const deviceId = "test_device_001";

        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                user.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            program.programId
        );

        // Get initial status
        const initialDevice = await program.account.device.fetch(devicePDA);
        const initialStatus = initialDevice.isActive;

        const tx = await program.methods
            .toggleDeviceStatus()
            .accounts({
                device: devicePDA,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        console.log("Toggle device status transaction signature:", tx);

        // Verify status toggle
        const device = await program.account.device.fetch(devicePDA);
        expect(device.isActive).to.equal(!initialStatus);
    });

    it("Pauses and resumes the program (authority only)", async () => {
        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            program.programId
        );

        // Pause program
        const pauseTx = await program.methods
            .pauseProgram()
            .accounts({
                programState: programStatePDA,
                authority: authority.publicKey,
            })
            .signers([authority])
            .rpc();

        console.log("Pause program transaction signature:", pauseTx);

        // Verify program is paused
        let programState = await program.account.programState.fetch(
            programStatePDA
        );
        expect(programState.isActive).to.be.false;

        // Resume program
        const resumeTx = await program.methods
            .resumeProgram()
            .accounts({
                programState: programStatePDA,
                authority: authority.publicKey,
            })
            .signers([authority])
            .rpc();

        console.log("Resume program transaction signature:", resumeTx);

        // Verify program is resumed
        programState = await program.account.programState.fetch(
            programStatePDA
        );
        expect(programState.isActive).to.be.true;
    });

    it("Handles multiple devices and data submissions", async () => {
        // Register second device
        const deviceId2 = "test_device_002";
        const deviceType2 = { router: {} };
        const location2 = {
            latitude: new anchor.BN(35680000000),
            longitude: new anchor.BN(139700000000),
            accuracy: new anchor.BN(100),
        };

        const [devicePDA2] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                user.publicKey.toBuffer(),
                Buffer.from(deviceId2),
            ],
            program.programId
        );

        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            program.programId
        );

        await program.methods
            .registerDevice(deviceId2, deviceType2, location2)
            .accounts({
                device: devicePDA2,
                programState: programStatePDA,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([user])
            .rpc();

        // Submit data from both devices
        for (let i = 0; i < 3; i++) {
            // Device 1
            const qualityData1 = {
                signalStrength: -60 + i * 5,
                latency: 40 + i * 10,
                throughput: new anchor.BN(1200000 + i * 100000),
                availability: 0.9 + i * 0.02,
                location: {
                    latitude: new anchor.BN(35676200000),
                    longitude: new anchor.BN(139650300000),
                    accuracy: new anchor.BN(100),
                },
            };

            const [dataSubmissionPDA1] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("data"),
                    devicePDA.toBuffer(),
                    Buffer.from((Date.now() + i).toString()),
                ],
                program.programId
            );

            await program.methods
                .submitData(qualityData1)
                .accounts({
                    device: devicePDA,
                    dataSubmission: dataSubmissionPDA1,
                    programState: programStatePDA,
                    rewardVault: rewardVault,
                    userTokenAccount: userTokenAccount,
                    user: user.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .signers([user])
                .rpc();

            // Device 2
            const qualityData2 = {
                signalStrength: -70 + i * 3,
                latency: 60 + i * 5,
                throughput: new anchor.BN(800000 + i * 50000),
                availability: 0.85 + i * 0.03,
                location: {
                    latitude: new anchor.BN(35680000000),
                    longitude: new anchor.BN(139700000000),
                    accuracy: new anchor.BN(100),
                },
            };

            const [dataSubmissionPDA2] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("data"),
                    devicePDA2.toBuffer(),
                    Buffer.from((Date.now() + i + 1000).toString()),
                ],
                program.programId
            );

            await program.methods
                .submitData(qualityData2)
                .accounts({
                    device: devicePDA2,
                    dataSubmission: dataSubmissionPDA2,
                    programState: programStatePDA,
                    rewardVault: rewardVault,
                    userTokenAccount: userTokenAccount,
                    user: user.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .signers([user])
                .rpc();
        }

        // Verify final program state
        const finalProgramState = await program.account.programState.fetch(
            programStatePDA
        );
        expect(finalProgramState.totalDevices.toNumber()).to.equal(2);

        // Verify device stats
        const device1 = await program.account.device.fetch(devicePDA);
        const device2 = await program.account.device.fetch(devicePDA2);

        expect(device1.totalUptime.toNumber()).to.be.greaterThan(0);
        expect(device2.totalUptime.toNumber()).to.be.greaterThan(0);
        expect(device1.totalRewardsEarned.toNumber()).to.be.greaterThan(0);
        expect(device2.totalRewardsEarned.toNumber()).to.be.greaterThan(0);
    });
});
