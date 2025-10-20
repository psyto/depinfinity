/**
 * Demo Simulator for DePINfinity
 *
 * This simulator creates realistic demo data and scenarios
 * for hackathon demonstration purposes.
 */

// Import mock services - these will be resolved at runtime
const mockSolanaProgram = require("../mock-solana/src");
const mockCordaNetwork = require("../mock-corda/src");

export interface DemoScenario {
    name: string;
    description: string;
    duration: number; // in milliseconds
    actions: DemoAction[];
}

export interface DemoAction {
    type:
        | "register_device"
        | "submit_data"
        | "create_agreement"
        | "execute_contract";
    delay: number; // delay before action in milliseconds
    data: any;
}

class DemoSimulator {
    private isRunning: boolean = false;
    private currentScenario: DemoScenario | null = null;
    private actionTimeouts: NodeJS.Timeout[] = [];

    constructor() {
        this.setupEventListeners();
    }

    /**
     * Start demo simulation
     */
    async startDemo(): Promise<void> {
        if (this.isRunning) {
            console.log("Demo is already running");
            return;
        }

        this.isRunning = true;
        console.log("🎬 Starting DePINfinity Demo Simulation");

        // Initialize systems
        await mockSolanaProgram.initialize();

        // Create demo scenarios
        const scenarios = this.createDemoScenarios();

        // Run scenarios sequentially
        for (const scenario of scenarios) {
            await this.runScenario(scenario);
        }

        console.log("🎬 Demo simulation completed");
        this.isRunning = false;
    }

    /**
     * Create demo scenarios
     */
    private createDemoScenarios(): DemoScenario[] {
        return [
            {
                name: "Initial Setup",
                description:
                    "Register initial devices and start data collection",
                duration: 60000, // 1 minute
                actions: [
                    {
                        type: "register_device",
                        delay: 1000,
                        data: {
                            deviceId: "demo_device_1",
                            deviceType: "Smartphone",
                            location: {
                                latitude: 35.6762,
                                longitude: 139.6503,
                                accuracy: 10,
                            },
                            owner: "demo_user_1",
                        },
                    },
                    {
                        type: "register_device",
                        delay: 5000,
                        data: {
                            deviceId: "demo_device_2",
                            deviceType: "Router",
                            location: {
                                latitude: 35.6762,
                                longitude: 139.6503,
                                accuracy: 15,
                            },
                            owner: "demo_user_2",
                        },
                    },
                    {
                        type: "register_device",
                        delay: 10000,
                        data: {
                            deviceId: "demo_device_3",
                            deviceType: "Hotspot",
                            location: {
                                latitude: 35.6762,
                                longitude: 139.6503,
                                accuracy: 20,
                            },
                            owner: "demo_user_3",
                        },
                    },
                ],
            },
            {
                name: "Data Collection",
                description: "Simulate network data collection and rewards",
                duration: 120000, // 2 minutes
                actions: [
                    {
                        type: "submit_data",
                        delay: 15000,
                        data: {
                            deviceId: "demo_device_1",
                            qualityData: {
                                signalStrength: -65,
                                latency: 45,
                                throughput: 1200000,
                                availability: 0.95,
                                location: {
                                    latitude: 35.6762,
                                    longitude: 139.6503,
                                    accuracy: 10,
                                },
                            },
                        },
                    },
                    {
                        type: "submit_data",
                        delay: 20000,
                        data: {
                            deviceId: "demo_device_2",
                            qualityData: {
                                signalStrength: -70,
                                latency: 35,
                                throughput: 1500000,
                                availability: 0.98,
                                location: {
                                    latitude: 35.6762,
                                    longitude: 139.6503,
                                    accuracy: 15,
                                },
                            },
                        },
                    },
                    {
                        type: "submit_data",
                        delay: 25000,
                        data: {
                            deviceId: "demo_device_3",
                            qualityData: {
                                signalStrength: -75,
                                latency: 55,
                                throughput: 800000,
                                availability: 0.92,
                                location: {
                                    latitude: 35.6762,
                                    longitude: 139.6503,
                                    accuracy: 20,
                                },
                            },
                        },
                    },
                ],
            },
            {
                name: "B2B Integration",
                description: "Create B2B agreements and contracts",
                duration: 180000, // 3 minutes
                actions: [
                    {
                        type: "create_agreement",
                        delay: 30000,
                        data: {
                            partnerId: "softbank_mobile",
                            region: "Tokyo",
                            terms: {
                                dataSharing: true,
                                infrastructureAccess: true,
                                revenueSharing: 15.0,
                                duration: 12,
                            },
                            networkData: {
                                averageQuality: 0.95,
                                coverageArea: 1000,
                                deviceCount: 3,
                            },
                        },
                    },
                    {
                        type: "create_agreement",
                        delay: 45000,
                        data: {
                            partnerId: "kddi_au",
                            region: "Osaka",
                            terms: {
                                dataSharing: true,
                                infrastructureAccess: false,
                                revenueSharing: 12.0,
                                duration: 6,
                            },
                            networkData: {
                                averageQuality: 0.88,
                                coverageArea: 800,
                                deviceCount: 2,
                            },
                        },
                    },
                ],
            },
        ];
    }

    /**
     * Run a demo scenario
     */
    private async runScenario(scenario: DemoScenario): Promise<void> {
        console.log(`🎭 Running scenario: ${scenario.name}`);
        this.currentScenario = scenario;

        // Execute actions with delays
        for (const action of scenario.actions) {
            const timeout = setTimeout(async () => {
                await this.executeAction(action);
            }, action.delay);

            this.actionTimeouts.push(timeout);
        }

        // Wait for scenario to complete
        await new Promise((resolve) => setTimeout(resolve, scenario.duration));

        // Clear timeouts
        this.actionTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.actionTimeouts = [];
    }

    /**
     * Execute a demo action
     */
    private async executeAction(action: DemoAction): Promise<void> {
        try {
            switch (action.type) {
                case "register_device":
                    await mockSolanaProgram.registerDevice(
                        action.data.deviceId,
                        action.data.deviceType,
                        action.data.location,
                        action.data.owner
                    );
                    console.log(
                        `📱 Device registered: ${action.data.deviceId}`
                    );
                    break;

                case "submit_data":
                    await mockSolanaProgram.submitData(
                        action.data.deviceId,
                        action.data.qualityData
                    );
                    console.log(
                        `📊 Data submitted for: ${action.data.deviceId}`
                    );
                    break;

                case "create_agreement":
                    await mockCordaNetwork.createRoamingAgreement(
                        action.data.partnerId,
                        action.data.region,
                        action.data.terms,
                        action.data.networkData
                    );
                    console.log(
                        `🤝 Roaming agreement created with: ${action.data.partnerId}`
                    );
                    break;

                case "execute_contract":
                    await mockCordaNetwork.executeInfrastructureContract(
                        action.data.contractId
                    );
                    console.log(
                        `🏗️ Infrastructure contract executed: ${action.data.contractId}`
                    );
                    break;
            }
        } catch (error) {
            console.error(`Error executing action ${action.type}:`, error);
        }
    }

    /**
     * Setup event listeners for demo feedback
     */
    private setupEventListeners(): void {
        mockSolanaProgram.on("deviceRegistered", (device: any) => {
            console.log(
                `✅ Device registered: ${device.id} (${device.deviceType})`
            );
        });

        mockSolanaProgram.on("dataSubmitted", (data: any) => {
            console.log(
                `📊 Data submitted: ${data.deviceId}, reward: ${data.rewardAmount} tokens`
            );
        });

        mockCordaNetwork.on("roamingAgreementCreated", (agreement: any) => {
            console.log(
                `🤝 Roaming agreement created: ${agreement.id} with ${agreement.partnerId}`
            );
        });

        mockCordaNetwork.on("roamingAgreementExecuted", (data: any) => {
            console.log(
                `💰 Agreement executed: ${data.agreement.id}, revenue: $${data.revenue}`
            );
        });
    }

    /**
     * Stop demo simulation
     */
    stopDemo(): void {
        this.isRunning = false;
        this.actionTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.actionTimeouts = [];
        console.log("🛑 Demo simulation stopped");
    }

    /**
     * Reset demo state
     */
    resetDemo(): void {
        this.stopDemo();
        mockSolanaProgram.reset();
        mockCordaNetwork.reset();
        console.log("🔄 Demo state reset");
    }

    /**
     * Get demo statistics
     */
    getDemoStats(): {
        solanaStats: any;
        cordaStats: any;
        isRunning: boolean;
    } {
        return {
            solanaStats: mockSolanaProgram.getNetworkStats(),
            cordaStats: mockCordaNetwork.getNetworkStats(),
            isRunning: this.isRunning,
        };
    }
}

// Export singleton instance
export const demoSimulator = new DemoSimulator();
export default demoSimulator;
