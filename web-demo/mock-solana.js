/**
 * Mock Solana Program for DePINfinity Web Demo
 * Browser-compatible version
 */

class MockSolanaProgram {
    constructor() {
        this.devices = new Map();
        this.programState = {
            totalDevices: 0,
            totalRewardsDistributed: 0,
            isActive: true,
        };
        this.rewardVault = 1000000000; // 1 billion tokens
        this.isSimulating = false;
        this.listeners = new Map();

        this.startDataSimulation();
    }

    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback) => callback(data));
        }
    }

    /**
     * Initialize the program
     */
    async initialize() {
        console.log("🚀 Mock Solana Program Initialized");
        this.emit("programInitialized", this.programState);
        return "mock_tx_initialize_123";
    }

    /**
     * Register a new device
     */
    async registerDevice(deviceId, deviceType, location, owner) {
        const device = {
            id: deviceId,
            owner,
            deviceType,
            location,
            isActive: true,
            totalUptime: 0,
            totalRewardsEarned: 0,
            lastActivity: Date.now(),
        };

        this.devices.set(deviceId, device);
        this.programState.totalDevices++;

        console.log(`📱 Device registered: ${deviceId} (${deviceType})`);
        this.emit("deviceRegistered", device);

        return "mock_tx_register_device_123";
    }

    /**
     * Submit network quality data
     */
    async submitData(deviceId, qualityData) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error("Device not found");
        }

        if (!device.isActive) {
            throw new Error("Device is not active");
        }

        // Calculate rewards based on data quality
        const rewardAmount = this.calculateReward(
            qualityData,
            device.totalUptime
        );

        // Update device stats
        device.totalUptime++;
        device.totalRewardsEarned += rewardAmount;
        device.lastActivity = Date.now();
        device.location = qualityData.location;

        // Update program state
        this.programState.totalRewardsDistributed += rewardAmount;
        this.rewardVault -= rewardAmount;

        console.log(
            `📊 Data submitted for ${deviceId}, reward: ${rewardAmount} tokens`
        );
        this.emit("dataSubmitted", { deviceId, qualityData, rewardAmount });
        this.emit("deviceUpdated", device);

        return "mock_tx_submit_data_123";
    }

    /**
     * Get device information
     */
    async getDevice(deviceId) {
        return this.devices.get(deviceId) || null;
    }

    /**
     * Get program state
     */
    async getProgramState() {
        return { ...this.programState };
    }

    /**
     * Toggle device status
     */
    async toggleDeviceStatus(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error("Device not found");
        }

        device.isActive = !device.isActive;
        device.lastActivity = Date.now();

        console.log(
            `🔄 Device ${deviceId} status: ${device.isActive ? "Active" : "Inactive"}`
        );
        this.emit("deviceStatusChanged", device);

        return "mock_tx_toggle_status_123";
    }

    /**
     * Calculate reward based on data quality
     */
    calculateReward(qualityData, uptime) {
        const baseReward = 1000; // Base reward in tokens

        // Quality multipliers
        const signalMultiplier =
            qualityData.signalStrength > -70
                ? 1.5
                : qualityData.signalStrength > -80
                  ? 0.8
                  : 0.3;
        const latencyMultiplier =
            qualityData.latency < 50
                ? 1.2
                : qualityData.latency < 100
                  ? 1.0
                  : 0.6;
        const throughputMultiplier =
            qualityData.throughput > 1000000
                ? 1.3
                : qualityData.throughput > 500000
                  ? 1.0
                  : 0.7;
        const availabilityMultiplier = qualityData.availability;

        // Uptime bonus
        const uptimeBonus = 1.0 + (uptime / 1000) * 0.5;

        const totalMultiplier =
            signalMultiplier *
            latencyMultiplier *
            throughputMultiplier *
            availabilityMultiplier *
            uptimeBonus;

        return Math.floor(baseReward * totalMultiplier);
    }

    /**
     * Start data simulation for demo
     */
    startDataSimulation() {
        if (this.isSimulating) return;

        this.isSimulating = true;

        // Simulate data submission every 30 seconds
        setInterval(() => {
            this.simulateDataSubmission();
        }, 30000);

        console.log("🔄 Data simulation started");
    }

    /**
     * Simulate data submission for demo
     */
    simulateDataSubmission() {
        const activeDevices = Array.from(this.devices.values()).filter(
            (d) => d.isActive
        );

        if (activeDevices.length === 0) return;

        // Randomly select a device
        const randomDevice =
            activeDevices[Math.floor(Math.random() * activeDevices.length)];

        // Generate realistic network data
        const qualityData = {
            signalStrength: -65 + Math.random() * 20, // -65 to -45 dBm
            latency: 20 + Math.random() * 80, // 20-100ms
            throughput: 500000 + Math.random() * 1500000, // 0.5-2 Mbps
            availability: 0.8 + Math.random() * 0.2, // 80-100%
            location: {
                latitude:
                    randomDevice.location.latitude +
                    (Math.random() - 0.5) * 0.01,
                longitude:
                    randomDevice.location.longitude +
                    (Math.random() - 0.5) * 0.01,
                accuracy: 10 + Math.random() * 50,
            },
        };

        // Submit data
        this.submitData(randomDevice.id, qualityData);
    }

    /**
     * Get all devices
     */
    getAllDevices() {
        return Array.from(this.devices.values());
    }

    /**
     * Get network statistics
     */
    getNetworkStats() {
        const devices = Array.from(this.devices.values());
        const activeDevices = devices.filter((d) => d.isActive);

        return {
            totalDevices: devices.length,
            activeDevices: activeDevices.length,
            totalRewards: this.programState.totalRewardsDistributed,
            averageQuality:
                activeDevices.length > 0
                    ? activeDevices.reduce(
                          (sum, d) =>
                              sum + d.totalRewardsEarned / d.totalUptime,
                          0
                      ) / activeDevices.length
                    : 0,
        };
    }

    /**
     * Reset program state for demo
     */
    reset() {
        this.devices.clear();
        this.programState = {
            totalDevices: 0,
            totalRewardsDistributed: 0,
            isActive: true,
        };
        this.rewardVault = 1000000000;
        console.log("🔄 Mock program reset");
    }
}

// Export for browser
window.MockSolanaProgram = MockSolanaProgram;
