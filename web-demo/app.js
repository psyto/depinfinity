/**
 * DePINfinity Web Demo Application
 * Main application logic for browser demo
 */

class DePINfinityWebApp {
    constructor() {
        this.isConnected = false;
        this.deviceStats = null;
        this.networkData = null;
        this.isDataCollectionActive = false;
        this.deviceId = `device_${Date.now()}`;
        this.b2bStats = null;
        this.isDemoRunning = false;

        // Initialize mock services
        this.mockSolanaProgram = new MockSolanaProgram();
        this.mockCordaNetwork = new MockCordaNetwork();
        this.demoSimulator = new DemoSimulator();

        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    async initializeApp() {
        try {
            console.log("Initializing DePINfinity Web App...");

            // Wait for mock services to be available
            await this.waitForMockServices();

            // Initialize mock services
            console.log("Initializing mock services...");
            await this.mockSolanaProgram.initialize();
            this.isConnected = true;
            this.updateConnectionStatus();

            // Set up event listeners
            this.setupEventListeners();

            // Load initial stats
            await this.loadDeviceStats();
            await this.loadB2bStats();

            console.log("App initialized successfully");
            this.log('Demo ready. Click "Start Demo" to begin.', "info");
        } catch (error) {
            console.error("Failed to initialize connection:", error);
            this.log(
                "Connection Error: Failed to connect to DePINfinity network",
                "error"
            );
        }
    }

    /**
     * Wait for mock services to be available
     */
    async waitForMockServices() {
        const maxWaitTime = 5000; // 5 seconds
        const checkInterval = 100; // 100ms
        let elapsed = 0;

        while (elapsed < maxWaitTime) {
            if (window.mockSolanaProgram && window.mockCordaNetwork) {
                console.log("Mock services are available");
                return;
            }

            console.log(`Waiting for mock services... (${elapsed}ms)`);
            await new Promise((resolve) => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
        }

        throw new Error("Mock services not available after 5 seconds");
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.mockSolanaProgram.on("deviceRegistered", (device) => {
            console.log("Device registered:", device);
            this.loadDeviceStats();
            this.log(
                `Device registered: ${device.id} (${device.deviceType})`,
                "success"
            );
        });

        this.mockSolanaProgram.on("dataSubmitted", (data) => {
            console.log("Data submitted:", data);
            this.networkData = data.qualityData;
            this.updateNetworkDataDisplay();
            this.loadDeviceStats();
            this.log(
                `Data submitted: ${data.deviceId}, reward: ${data.rewardAmount} tokens`,
                "success"
            );
        });

        this.mockSolanaProgram.on("deviceUpdated", (device) => {
            console.log("Device updated:", device);
            this.loadDeviceStats();
        });

        this.mockCordaNetwork.on("networkDataMigrated", (data) => {
            console.log("Network data migrated to Corda:", data);
            this.loadB2bStats();
            this.log(
                `Network data migrated to Corda for region: ${data.region}`,
                "info"
            );
        });

        this.mockCordaNetwork.on("roamingAgreementExecuted", (data) => {
            console.log("Roaming agreement executed:", data);
            this.loadB2bStats();
            this.log(
                `Roaming agreement executed: $${data.revenue} revenue`,
                "success"
            );
        });
    }

    /**
     * Load device statistics
     */
    async loadDeviceStats() {
        try {
            const device = await this.mockSolanaProgram.getDevice(
                this.deviceId
            );
            if (device) {
                this.deviceStats = {
                    totalUptime: device.totalUptime,
                    totalRewardsEarned: device.totalRewardsEarned,
                    isActive: device.isActive,
                    lastActivity: device.lastActivity,
                };
                this.updateDeviceStatsDisplay();
            }
        } catch (error) {
            console.log("Device not registered yet");
        }
    }

    /**
     * Load B2B statistics
     */
    async loadB2bStats() {
        try {
            const stats = this.mockCordaNetwork.getNetworkStats();
            this.b2bStats = stats;
            this.updateB2bStatsDisplay();
        } catch (error) {
            console.log("B2B stats not available");
        }
    }

    /**
     * Register device
     */
    async registerDevice() {
        try {
            const deviceType = "Smartphone";
            const location = await this.getCurrentLocation();

            await this.mockSolanaProgram.registerDevice(
                this.deviceId,
                deviceType,
                location,
                "user_wallet_address"
            );
            this.log("Device registered successfully!", "success");
            await this.loadDeviceStats();
        } catch (error) {
            console.error("Registration failed:", error);
            this.log("Registration Error: Failed to register device", "error");
        }
    }

    /**
     * Get current location (simulated for demo)
     */
    async getCurrentLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log("Geolocation successful:", position.coords);
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (error) => {
                        console.warn(
                            "Geolocation error:",
                            error.message || error
                        );
                        console.log("Using fallback coordinates for demo");
                        // Fallback to Tokyo coordinates for demo
                        resolve({
                            latitude: 35.6762,
                            longitude: 139.6503,
                            accuracy: 100,
                        });
                    },
                    {
                        timeout: 5000,
                        enableHighAccuracy: false,
                        maximumAge: 300000, // 5 minutes
                    }
                );
            } else {
                console.log(
                    "Geolocation not supported, using fallback coordinates"
                );
                // Fallback to Tokyo coordinates for demo
                resolve({
                    latitude: 35.6762,
                    longitude: 139.6503,
                    accuracy: 100,
                });
            }
        });
    }

    /**
     * Toggle data collection
     */
    async toggleDataCollection() {
        if (this.isDataCollectionActive) {
            this.isDataCollectionActive = false;
            console.log("Data collection stopped");
            this.log("Data collection stopped", "info");
        } else {
            this.isDataCollectionActive = true;
            console.log("Data collection started");
            this.log("Data collection started", "info");
            // Start manual data collection simulation
            this.startDataCollectionSimulation();
        }
    }

    /**
     * Start data collection simulation
     */
    startDataCollectionSimulation() {
        const interval = setInterval(async () => {
            if (!this.isDataCollectionActive) {
                clearInterval(interval);
                return;
            }
            await this.collectAndSubmitData();
        }, 30000); // 30 seconds interval
    }

    /**
     * Collect and submit data
     */
    async collectAndSubmitData() {
        try {
            const location = await this.getCurrentLocation();

            // Generate more realistic network data based on location
            const qualityData = this.generateRealisticNetworkData(location);

            console.log("Submitting network data:", qualityData);
            await this.mockSolanaProgram.submitData(this.deviceId, qualityData);
            this.networkData = qualityData;
            this.updateNetworkDataDisplay();
            await this.loadDeviceStats();
        } catch (error) {
            console.error("Data submission failed:", error);
        }
    }

    /**
     * Generate realistic network data based on location
     */
    generateRealisticNetworkData(location) {
        // Simulate different network conditions based on location
        const isUrban = location.latitude > 35.5 && location.latitude < 35.8;
        const baseSignal = isUrban ? -60 : -70;
        const baseLatency = isUrban ? 20 : 40;
        const baseThroughput = isUrban ? 1000000 : 500000;

        return {
            signalStrength: baseSignal + (Math.random() - 0.5) * 20,
            latency: baseLatency + Math.random() * 40,
            throughput: baseThroughput + Math.random() * 1000000,
            availability: 0.85 + Math.random() * 0.15,
            location: {
                latitude: location.latitude + (Math.random() - 0.5) * 0.01,
                longitude: location.longitude + (Math.random() - 0.5) * 0.01,
                accuracy: location.accuracy + Math.random() * 50,
            },
        };
    }

    /**
     * Start demo
     */
    async startDemo() {
        try {
            console.log("Starting demo...");
            this.isDemoRunning = true;
            this.updateDemoButtons();

            // Check if mock services are available
            if (!window.mockSolanaProgram) {
                throw new Error(
                    "Mock Solana Program not available. Please refresh the page."
                );
            }
            if (!window.mockCordaNetwork) {
                throw new Error(
                    "Mock Corda Network not available. Please refresh the page."
                );
            }

            console.log("Mock services are available, starting demo...");
            console.log("Calling demoSimulator.startDemo()...");
            await this.demoSimulator.startDemo();

            this.log(
                "Demo Started: Demo simulation is running in the background",
                "success"
            );
        } catch (error) {
            console.error("Demo failed:", error);
            this.log(`Demo Error: ${error.message}`, "error");
        } finally {
            this.isDemoRunning = false;
            this.updateDemoButtons();
        }
    }

    /**
     * Stop demo
     */
    stopDemo() {
        this.demoSimulator.stopDemo();
        this.isDemoRunning = false;
        this.updateDemoButtons();
        this.log("Demo Stopped: Demo simulation has been stopped", "info");
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus() {
        const statusIndicator = document.getElementById("statusIndicator");
        const statusText = document.getElementById("statusText");

        if (this.isConnected) {
            statusIndicator.classList.add("connected");
            statusText.textContent = "Connected";
        } else {
            statusIndicator.classList.remove("connected");
            statusText.textContent = "Disconnected";
        }
    }

    /**
     * Update device stats display
     */
    updateDeviceStatsDisplay() {
        if (!this.deviceStats) return;

        document.getElementById("totalUptime").textContent =
            this.deviceStats.totalUptime;
        document.getElementById("totalRewards").textContent =
            this.deviceStats.totalRewardsEarned.toFixed(2);
        document.getElementById("deviceStatus").textContent = this.deviceStats
            .isActive
            ? "Active"
            : "Inactive";
        document.getElementById("lastActivity").textContent = new Date(
            this.deviceStats.lastActivity
        ).toLocaleString();

        document.getElementById("deviceStatsSection").style.display = "block";
    }

    /**
     * Update B2B stats display
     */
    updateB2bStatsDisplay() {
        if (!this.b2bStats) return;

        document.getElementById("dataPoints").textContent =
            this.b2bStats.totalDataPoints;
        document.getElementById("activeAgreements").textContent =
            this.b2bStats.activeAgreements;
        document.getElementById("activeContracts").textContent =
            this.b2bStats.activeContracts;
        document.getElementById("totalRevenue").textContent =
            `$${this.b2bStats.totalRevenue.toFixed(2)}`;

        document.getElementById("b2bStatsSection").style.display = "block";
    }

    /**
     * Update network data display
     */
    updateNetworkDataDisplay() {
        if (!this.networkData) return;

        document.getElementById("signalStrength").textContent =
            `${this.networkData.signalStrength.toFixed(1)} dBm`;
        document.getElementById("latency").textContent =
            `${this.networkData.latency.toFixed(0)} ms`;
        document.getElementById("throughput").textContent =
            `${(this.networkData.throughput / 1000000).toFixed(1)} Mbps`;
        document.getElementById("availability").textContent =
            `${(this.networkData.availability * 100).toFixed(1)}%`;

        document.getElementById("networkDataSection").style.display = "block";
    }

    /**
     * Update demo buttons
     */
    updateDemoButtons() {
        const startBtn = document.getElementById("startDemoBtn");
        const stopBtn = document.getElementById("stopDemoBtn");

        if (this.isDemoRunning) {
            startBtn.disabled = true;
            startBtn.textContent = "Demo Running...";
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            startBtn.textContent = "Start Demo";
            stopBtn.disabled = false;
        }
    }

    /**
     * Add log entry
     */
    log(message, type = "info") {
        const logContainer = document.getElementById("demoLog");
        const logEntry = document.createElement("div");
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Keep only last 50 entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded - Initializing app...");

    // Wait a bit for all scripts to load and mock services to be available
    setTimeout(() => {
        try {
            console.log("Creating app instance...");
            const app = new DePINfinityWebApp();
            console.log("App instance created:", app);

            // Set up event listeners
            const startBtn = document.getElementById("startDemoBtn");
            const stopBtn = document.getElementById("stopDemoBtn");
            const registerBtn = document.getElementById("registerDeviceBtn");
            const submitBtn = document.getElementById("submitDataBtn");
            const toggleBtn = document.getElementById("dataCollectionToggle");

            console.log("Setting up event listeners...");
            console.log("Start button:", startBtn);
            console.log("Stop button:", stopBtn);
            console.log("Register button:", registerBtn);
            console.log("Submit button:", submitBtn);
            console.log("Toggle button:", toggleBtn);

            if (startBtn) {
                startBtn.addEventListener("click", () => {
                    console.log("Start Demo button clicked");
                    app.startDemo();
                });
            } else {
                console.error("Start Demo button not found!");
            }

            if (stopBtn) {
                stopBtn.addEventListener("click", () => {
                    console.log("Stop Demo button clicked");
                    app.stopDemo();
                });
            }

            if (registerBtn) {
                registerBtn.addEventListener("click", () => {
                    console.log("Register Device button clicked");
                    app.registerDevice();
                });
            }

            if (submitBtn) {
                submitBtn.addEventListener("click", () => {
                    console.log("Submit Data button clicked");
                    app.collectAndSubmitData();
                });
            }

            if (toggleBtn) {
                toggleBtn.addEventListener("change", (e) => {
                    console.log(
                        "Data collection toggle changed:",
                        e.target.checked
                    );
                    app.isDataCollectionActive = e.target.checked;
                    if (app.isDataCollectionActive) {
                        app.startDataCollectionSimulation();
                    }
                });
            }

            console.log("Event listeners set up successfully");
        } catch (error) {
            console.error("Error initializing app:", error);
        }
    }, 200); // Wait 200ms for all scripts to load
});
