export interface DePINfinity {
    address: "DePINfinity111111111111111111111111111111111";
    metadata: {
        name: "depinfinity";
        version: "0.1.0";
        spec: "0.1.0";
        description: "DePINfinity: Hybrid Mobile Infrastructure DePIN on Solana";
    };
    instructions: [
        {
            name: "initialize";
            discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
            accounts: [
                {
                    name: "programState";
                    writable: true;
                },
                {
                    name: "authority";
                    writable: true;
                    signer: true;
                },
                {
                    name: "systemProgram";
                    writable: false;
                }
            ];
            args: [];
        },
        {
            name: "registerDevice";
            discriminator: [51, 57, 225, 47, 182, 146, 45, 75];
            accounts: [
                {
                    name: "device";
                    writable: true;
                },
                {
                    name: "programState";
                    writable: true;
                },
                {
                    name: "user";
                    writable: true;
                    signer: true;
                },
                {
                    name: "systemProgram";
                    writable: false;
                }
            ];
            args: [
                {
                    name: "deviceId";
                    type: "string";
                },
                {
                    name: "deviceType";
                    type: {
                        defined: {
                            name: "DeviceType";
                        };
                    };
                },
                {
                    name: "initialLocation";
                    type: {
                        defined: {
                            name: "LocationData";
                        };
                    };
                }
            ];
        },
        {
            name: "submitData";
            discriminator: [163, 52, 200, 231, 140, 3, 69, 186];
            accounts: [
                {
                    name: "device";
                    writable: true;
                },
                {
                    name: "dataSubmission";
                    writable: true;
                },
                {
                    name: "programState";
                    writable: true;
                },
                {
                    name: "rewardVault";
                    writable: true;
                },
                {
                    name: "userTokenAccount";
                    writable: true;
                },
                {
                    name: "user";
                    writable: true;
                    signer: true;
                },
                {
                    name: "tokenProgram";
                    writable: false;
                },
                {
                    name: "systemProgram";
                    writable: false;
                }
            ];
            args: [
                {
                    name: "qualityData";
                    type: {
                        defined: {
                            name: "NetworkQualityData";
                        };
                    };
                }
            ];
        }
    ];
    accounts: [
        {
            name: "ProgramState";
            discriminator: [208, 109, 178, 1, 111, 66, 15, 115];
            data: [
                {
                    name: "authority";
                    type: "pubkey";
                },
                {
                    name: "totalDevices";
                    type: "u64";
                },
                {
                    name: "totalRewardsDistributed";
                    type: "u64";
                },
                {
                    name: "isActive";
                    type: "bool";
                },
                {
                    name: "bump";
                    type: "u8";
                }
            ];
        },
        {
            name: "Device";
            discriminator: [137, 73, 14, 131, 142, 87, 152, 138];
            data: [
                {
                    name: "owner";
                    type: "pubkey";
                },
                {
                    name: "deviceId";
                    type: "string";
                },
                {
                    name: "deviceType";
                    type: {
                        defined: {
                            name: "DeviceType";
                        };
                    };
                },
                {
                    name: "location";
                    type: {
                        defined: {
                            name: "LocationData";
                        };
                    };
                },
                {
                    name: "isActive";
                    type: "bool";
                },
                {
                    name: "totalUptime";
                    type: "u64";
                },
                {
                    name: "totalRewardsEarned";
                    type: "u64";
                },
                {
                    name: "lastActivity";
                    type: "i64";
                },
                {
                    name: "bump";
                    type: "u8";
                }
            ];
        }
    ];
    types: [
        {
            name: "DeviceType";
            type: {
                kind: "enum";
                variants: [
                    {
                        name: "Smartphone";
                    },
                    {
                        name: "Router";
                    },
                    {
                        name: "IoTDevice";
                    },
                    {
                        name: "Hotspot";
                    }
                ];
            };
        },
        {
            name: "LocationData";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "latitude";
                        type: "f64";
                    },
                    {
                        name: "longitude";
                        type: "f64";
                    },
                    {
                        name: "accuracy";
                        type: "f32";
                    }
                ];
            };
        },
        {
            name: "NetworkQualityData";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "signalStrength";
                        type: "i32";
                    },
                    {
                        name: "latency";
                        type: "u32";
                    },
                    {
                        name: "throughput";
                        type: "u64";
                    },
                    {
                        name: "availability";
                        type: "f32";
                    },
                    {
                        name: "location";
                        type: {
                            defined: {
                                name: "LocationData";
                            };
                        };
                    }
                ];
            };
        }
    ];
    errors: [
        {
            code: 6000;
            name: "DeviceInactive";
            msg: "Device is not active";
        },
        {
            code: 6001;
            name: "ProgramPaused";
            msg: "Program is paused";
        },
        {
            code: 6002;
            name: "InvalidDataQuality";
            msg: "Invalid data quality";
        },
        {
            code: 6003;
            name: "InsufficientRewards";
            msg: "Insufficient rewards in vault";
        }
    ];
}

export type DeviceType = "Smartphone" | "Router" | "IoTDevice" | "Hotspot";

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export interface NetworkQualityData {
    signalStrength: number;
    latency: number;
    throughput: number;
    availability: number;
    location: LocationData;
}

export interface ProgramState {
    authority: string;
    totalDevices: number;
    totalRewardsDistributed: number;
    isActive: boolean;
    bump: number;
}

export interface Device {
    owner: string;
    deviceId: string;
    deviceType: DeviceType;
    location: LocationData;
    isActive: boolean;
    totalUptime: number;
    totalRewardsEarned: number;
    lastActivity: number;
    bump: number;
}
