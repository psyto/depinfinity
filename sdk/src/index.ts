import {
    PublicKey,
    Connection,
    Keypair,
    Transaction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN, Idl } from "@coral-xyz/anchor";
import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { DePINfinity } from "./types/depinfinity";

export class DePINfinityClient {
    private program: Program<DePINfinity>;
    private connection: Connection;
    private provider: AnchorProvider;

    constructor(connection: Connection, wallet: Wallet, programId: PublicKey) {
        this.connection = connection;
        this.provider = new AnchorProvider(connection, wallet, {});
        this.program = new Program(this.getProgramIdl(), this.provider);
    }

    private getProgramIdl(): Idl {
        return {
            version: "0.1.0",
            name: "depinfinity",
            instructions: [
                {
                    name: "initialize",
                    accounts: [
                        { name: "programState", isMut: true, isSigner: false },
                        { name: "authority", isMut: true, isSigner: true },
                        {
                            name: "systemProgram",
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                    args: [],
                },
                {
                    name: "registerDevice",
                    accounts: [
                        { name: "device", isMut: true, isSigner: false },
                        { name: "programState", isMut: true, isSigner: false },
                        { name: "user", isMut: true, isSigner: true },
                        {
                            name: "systemProgram",
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                    args: [
                        { name: "deviceId", type: "string" },
                        { name: "deviceType", type: { defined: "DeviceType" } },
                        {
                            name: "initialLocation",
                            type: { defined: "LocationData" },
                        },
                    ],
                },
                {
                    name: "submitData",
                    accounts: [
                        { name: "device", isMut: true, isSigner: false },
                        {
                            name: "dataSubmission",
                            isMut: true,
                            isSigner: false,
                        },
                        { name: "programState", isMut: true, isSigner: false },
                        { name: "rewardVault", isMut: true, isSigner: false },
                        {
                            name: "userTokenAccount",
                            isMut: true,
                            isSigner: false,
                        },
                        { name: "user", isMut: true, isSigner: true },
                        { name: "tokenProgram", isMut: false, isSigner: false },
                        {
                            name: "systemProgram",
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                    args: [
                        {
                            name: "qualityData",
                            type: { defined: "NetworkQualityData" },
                        },
                    ],
                },
            ],
            accounts: [
                {
                    name: "ProgramState",
                    type: {
                        kind: "struct",
                        fields: [
                            { name: "authority", type: "publicKey" },
                            { name: "totalDevices", type: "u64" },
                            { name: "totalRewardsDistributed", type: "u64" },
                            { name: "isActive", type: "bool" },
                            { name: "bump", type: "u8" },
                        ],
                    },
                },
                {
                    name: "Device",
                    type: {
                        kind: "struct",
                        fields: [
                            { name: "owner", type: "publicKey" },
                            { name: "deviceId", type: "string" },
                            {
                                name: "deviceType",
                                type: { defined: "DeviceType" },
                            },
                            {
                                name: "location",
                                type: { defined: "LocationData" },
                            },
                            { name: "isActive", type: "bool" },
                            { name: "totalUptime", type: "u64" },
                            { name: "totalRewardsEarned", type: "u64" },
                            { name: "lastActivity", type: "i64" },
                            { name: "bump", type: "u8" },
                        ],
                    },
                },
            ],
            types: [
                {
                    name: "DeviceType",
                    type: {
                        kind: "enum",
                        variants: [
                            { name: "Smartphone" },
                            { name: "Router" },
                            { name: "IoTDevice" },
                            { name: "Hotspot" },
                        ],
                    },
                },
                {
                    name: "LocationData",
                    type: {
                        kind: "struct",
                        fields: [
                            { name: "latitude", type: "f64" },
                            { name: "longitude", type: "f64" },
                            { name: "accuracy", type: "f32" },
                        ],
                    },
                },
                {
                    name: "NetworkQualityData",
                    type: {
                        kind: "struct",
                        fields: [
                            { name: "signalStrength", type: "i32" },
                            { name: "latency", type: "u32" },
                            { name: "throughput", type: "u64" },
                            { name: "availability", type: "f32" },
                            {
                                name: "location",
                                type: { defined: "LocationData" },
                            },
                        ],
                    },
                },
            ],
        } as Idl;
    }

    // Get program state
    async getProgramState(): Promise<any> {
        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            this.program.programId
        );

        return await this.program.account.programState.fetch(programStatePDA);
    }

    // Get device information
    async getDevice(deviceId: string, owner: PublicKey): Promise<any> {
        const [devicePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("device"), owner.toBuffer(), Buffer.from(deviceId)],
            this.program.programId
        );

        return await this.program.account.device.fetch(devicePDA);
    }

    // Initialize the program (authority only)
    async initialize(): Promise<string> {
        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            this.program.programId
        );

        const tx = await this.program.methods
            .initialize()
            .accounts({
                programState: programStatePDA,
                authority: this.provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return tx;
    }

    // Register a new device
    async registerDevice(
        deviceId: string,
        deviceType: any,
        location: { latitude: number; longitude: number; accuracy: number }
    ): Promise<string> {
        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                this.provider.wallet.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            this.program.programId
        );

        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            this.program.programId
        );

        const tx = await this.program.methods
            .registerDevice(deviceId, deviceType, location)
            .accounts({
                device: devicePDA,
                programState: programStatePDA,
                user: this.provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return tx;
    }

    // Submit network quality data
    async submitData(
        deviceId: string,
        qualityData: {
            signalStrength: number;
            latency: number;
            throughput: number;
            availability: number;
            location: { latitude: number; longitude: number; accuracy: number };
        }
    ): Promise<string> {
        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                this.provider.wallet.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            this.program.programId
        );

        const [dataSubmissionPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("data"),
                devicePDA.toBuffer(),
                Buffer.from(Date.now().toString()),
            ],
            this.program.programId
        );

        const [programStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_state")],
            this.program.programId
        );

        // Get or create user token account
        const mint = new PublicKey("DOCOMO1111111111111111111111111111111111"); // DOCOMO token mint
        const userTokenAccount = await getAssociatedTokenAddress(
            mint,
            this.provider.wallet.publicKey
        );

        const tx = await this.program.methods
            .submitData(qualityData)
            .accounts({
                device: devicePDA,
                dataSubmission: dataSubmissionPDA,
                programState: programStatePDA,
                rewardVault: new PublicKey("REWARD_VAULT_ADDRESS"), // Set actual vault address
                userTokenAccount: userTokenAccount,
                user: this.provider.wallet.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return tx;
    }

    // Update device location
    async updateLocation(
        deviceId: string,
        newLocation: { latitude: number; longitude: number; accuracy: number }
    ): Promise<string> {
        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                this.provider.wallet.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            this.program.programId
        );

        const tx = await this.program.methods
            .updateLocation(newLocation)
            .accounts({
                device: devicePDA,
                user: this.provider.wallet.publicKey,
            })
            .rpc();

        return tx;
    }

    // Toggle device status
    async toggleDeviceStatus(deviceId: string): Promise<string> {
        const [devicePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("device"),
                this.provider.wallet.publicKey.toBuffer(),
                Buffer.from(deviceId),
            ],
            this.program.programId
        );

        const tx = await this.program.methods
            .toggleDeviceStatus()
            .accounts({
                device: devicePDA,
                user: this.provider.wallet.publicKey,
            })
            .rpc();

        return tx;
    }
}

// Utility functions for mobile app integration
export class MobileDePINClient {
    private client: DePINfinityClient;
    private deviceId: string;
    private isActive: boolean = false;
    private dataInterval: NodeJS.Timeout | null = null;

    constructor(client: DePINfinityClient, deviceId: string) {
        this.client = client;
        this.deviceId = deviceId;
    }

    // Start automatic data collection
    async startDataCollection(intervalMs: number = 30000): Promise<void> {
        if (this.isActive) return;

        this.isActive = true;
        this.dataInterval = setInterval(async () => {
            try {
                await this.collectAndSubmitData();
            } catch (error) {
                console.error("Error collecting data:", error);
            }
        }, intervalMs);
    }

    // Stop automatic data collection
    stopDataCollection(): void {
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
            this.dataInterval = null;
        }
        this.isActive = false;
    }

    // Collect network quality data from device
    private async collectNetworkData(): Promise<any> {
        // This would integrate with device APIs to collect real network data
        // For now, we'll simulate realistic data
        return {
            signalStrength: -65 + Math.random() * 20, // -65 to -45 dBm
            latency: 20 + Math.random() * 80, // 20-100ms
            throughput: 500000 + Math.random() * 1500000, // 0.5-2 Mbps
            availability: 0.8 + Math.random() * 0.2, // 80-100%
            location: await this.getCurrentLocation(),
        };
    }

    // Get current device location
    private async getCurrentLocation(): Promise<{
        latitude: number;
        longitude: number;
        accuracy: number;
    }> {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        // Fallback to default location
                        resolve({
                            latitude: 35.6762, // Tokyo coordinates
                            longitude: 139.6503,
                            accuracy: 100,
                        });
                    }
                );
            } else {
                reject(new Error("Geolocation not supported"));
            }
        });
    }

    // Collect and submit data
    private async collectAndSubmitData(): Promise<void> {
        const qualityData = await this.collectNetworkData();
        await this.client.submitData(this.deviceId, qualityData);
    }
}

export * from "./types/depinfinity";
