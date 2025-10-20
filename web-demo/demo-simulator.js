/**
 * Demo Simulator for DePINfinity Web Demo
 * Browser-compatible version
 */

class DemoSimulator {
    constructor() {
        this.isRunning = false;
        this.currentScenario = null;
        this.actionTimeouts = [];

        this.setupEventListeners();
    }

    /**
     * Start demo simulation
     */
    async startDemo() {
        console.log("DemoSimulator.startDemo() called");

        if (this.isRunning) {
            console.log("Demo is already running");
            return;
        }

        this.isRunning = true;
        console.log("🎬 Starting DePINfinity Demo Simulation");

        try {
            // Check if mock services are available
            if (!window.mockSolanaProgram) {
                throw new Error("Mock Solana Program not available");
            }
            if (!window.mockCordaNetwork) {
                throw new Error("Mock Corda Network not available");
            }

            // Initialize systems
            console.log("Initializing mock Solana program...");
            await window.mockSolanaProgram.initialize();

            // Create demo scenarios
            console.log("Creating demo scenarios...");
            const scenarios = this.createDemoScenarios();
            console.log("Created scenarios:", scenarios.length);

            // Run scenarios sequentially
            for (const scenario of scenarios) {
                console.log(`Running scenario: ${scenario.name}`);
                await this.runScenario(scenario);
            }

            console.log("🎬 Demo simulation completed");
        } catch (error) {
            console.error("Error in demo simulation:", error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Create demo scenarios
     */
    createDemoScenarios() {
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
    async runScenario(scenario) {
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
    async executeAction(action) {
        try {
            // Check if mock services are available
            if (!window.mockSolanaProgram || !window.mockCordaNetwork) {
                console.error(
                    "Mock services not available for action execution"
                );
                return;
            }

            switch (action.type) {
                case "register_device":
                    await window.mockSolanaProgram.registerDevice(
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
                    await window.mockSolanaProgram.submitData(
                        action.data.deviceId,
                        action.data.qualityData
                    );
                    console.log(
                        `📊 Data submitted for: ${action.data.deviceId}`
                    );
                    break;

                case "create_agreement":
                    await window.mockCordaNetwork.createRoamingAgreement(
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
                    await window.mockCordaNetwork.executeInfrastructureContract(
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
    setupEventListeners() {
        // Wait for mock services to be available
        const setupListeners = () => {
            if (window.mockSolanaProgram && window.mockCordaNetwork) {
                console.log("Setting up demo simulator event listeners...");

                window.mockSolanaProgram.on("deviceRegistered", (device) => {
                    console.log(
                        `✅ Device registered: ${device.id} (${device.deviceType})`
                    );
                });

                window.mockSolanaProgram.on("dataSubmitted", (data) => {
                    console.log(
                        `📊 Data submitted: ${data.deviceId}, reward: ${data.rewardAmount} tokens`
                    );
                });

                window.mockCordaNetwork.on(
                    "roamingAgreementCreated",
                    (agreement) => {
                        console.log(
                            `🤝 Roaming agreement created: ${agreement.id} with ${agreement.partnerId}`
                        );
                    }
                );

                window.mockCordaNetwork.on(
                    "roamingAgreementExecuted",
                    (data) => {
                        console.log(
                            `💰 Agreement executed: ${data.agreement.id}, revenue: $${data.revenue}`
                        );
                    }
                );
            } else {
                // Retry after a short delay
                setTimeout(setupListeners, 100);
            }
        };

        setupListeners();
    }

    /**
     * Stop demo simulation
     */
    stopDemo() {
        this.isRunning = false;
        this.actionTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.actionTimeouts = [];
        console.log("🛑 Demo simulation stopped");
    }

    /**
     * Reset demo state
     */
    resetDemo() {
        this.stopDemo();
        if (window.mockSolanaProgram) {
            window.mockSolanaProgram.reset();
        }
        if (window.mockCordaNetwork) {
            window.mockCordaNetwork.reset();
        }
        console.log("🔄 Demo state reset");
    }

    /**
     * Get demo statistics
     */
    getDemoStats() {
        return {
            solanaStats: window.mockSolanaProgram
                ? window.mockSolanaProgram.getNetworkStats()
                : null,
            cordaStats: window.mockCordaNetwork
                ? window.mockCordaNetwork.getNetworkStats()
                : null,
            isRunning: this.isRunning,
        };
    }
}

// Export for browser
window.DemoSimulator = DemoSimulator;
