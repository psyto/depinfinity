// @ts-nocheck - React Native types will be resolved at runtime
import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    Switch,
    Dimensions,
} from "react-native";
// Mock services for demo - these will be resolved at runtime
const mockSolanaProgram = require("../mock-solana/src");
const mockCordaNetwork = require("../mock-corda/src");
const demoSimulator = require("../demo-simulator/src");

// Type definitions
interface Device {
    id: string;
    owner: string;
    deviceType: "Smartphone" | "Router" | "IoTDevice" | "Hotspot";
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    isActive: boolean;
    totalUptime: number;
    totalRewardsEarned: number;
    lastActivity: number;
}

interface NetworkData {
    signalStrength: number;
    latency: number;
    throughput: number;
    availability: number;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
}

const { width, height } = Dimensions.get("window");

interface DeviceStats {
    totalUptime: number;
    totalRewardsEarned: number;
    isActive: boolean;
    lastActivity: number;
}

const App: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
    const [networkData, setNetworkData] = useState<NetworkData | null>(null);
    const [isDataCollectionActive, setIsDataCollectionActive] = useState(false);
    const [deviceId] = useState(`device_${Date.now()}`);
    const [b2bStats, setB2bStats] = useState<any>(null);
    const [isDemoRunning, setIsDemoRunning] = useState(false);

    // Initialize connection
    useEffect(() => {
        initializeConnection();
    }, []);

    const initializeConnection = async () => {
        try {
            // Initialize mock services
            await mockSolanaProgram.initialize();
            setIsConnected(true);

            // Set up event listeners
            mockSolanaProgram.on("deviceRegistered", (device: Device) => {
                console.log("Device registered:", device);
                loadDeviceStats();
            });

            mockSolanaProgram.on("dataSubmitted", (data: any) => {
                console.log("Data submitted:", data);
                setNetworkData(data.qualityData);
                loadDeviceStats();
            });

            mockSolanaProgram.on("deviceUpdated", (device: Device) => {
                console.log("Device updated:", device);
                loadDeviceStats();
            });

            mockCordaNetwork.on("networkDataMigrated", (data: any) => {
                console.log("Network data migrated to Corda:", data);
                loadB2bStats();
            });

            mockCordaNetwork.on("roamingAgreementExecuted", (data: any) => {
                console.log("Roaming agreement executed:", data);
                loadB2bStats();
            });

            // Load initial stats
            await loadDeviceStats();
            await loadB2bStats();
        } catch (error) {
            console.error("Failed to initialize connection:", error);
            Alert.alert(
                "Connection Error",
                "Failed to connect to DePINfinity network"
            );
        }
    };

    const loadDeviceStats = async () => {
        try {
            const device = await mockSolanaProgram.getDevice(deviceId);
            if (device) {
                setDeviceStats({
                    totalUptime: device.totalUptime,
                    totalRewardsEarned: device.totalRewardsEarned,
                    isActive: device.isActive,
                    lastActivity: device.lastActivity,
                });
            }
        } catch (error) {
            console.log("Device not registered yet");
        }
    };

    const loadB2bStats = async () => {
        try {
            const stats = mockCordaNetwork.getNetworkStats();
            setB2bStats(stats);
        } catch (error) {
            console.log("B2B stats not available");
        }
    };

    const registerDevice = async () => {
        try {
            const deviceType = "Smartphone";
            const location = await getCurrentLocation();

            await mockSolanaProgram.registerDevice(
                deviceId,
                deviceType,
                location,
                "user_wallet_address"
            );
            Alert.alert("Success", "Device registered successfully!");
            await loadDeviceStats();
        } catch (error) {
            console.error("Registration failed:", error);
            Alert.alert("Registration Error", "Failed to register device");
        }
    };

    const getCurrentLocation = async (): Promise<{
        latitude: number;
        longitude: number;
        accuracy: number;
    }> => {
        return new Promise((resolve, reject) => {
            if (typeof navigator !== "undefined" && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position: any) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (error: any) => {
                        console.error("Geolocation error:", error);
                        // Fallback to Tokyo coordinates
                        resolve({
                            latitude: 35.6762,
                            longitude: 139.6503,
                            accuracy: 100,
                        });
                    }
                );
            } else {
                // Fallback to Tokyo coordinates for demo
                resolve({
                    latitude: 35.6762,
                    longitude: 139.6503,
                    accuracy: 100,
                });
            }
        });
    };

    const toggleDataCollection = async () => {
        if (isDataCollectionActive) {
            setIsDataCollectionActive(false);
            console.log("Data collection stopped");
        } else {
            setIsDataCollectionActive(true);
            console.log("Data collection started");
            // Start manual data collection simulation
            startDataCollectionSimulation();
        }
    };

    const startDataCollectionSimulation = () => {
        const interval = setInterval(async () => {
            if (!isDataCollectionActive) {
                clearInterval(interval);
                return;
            }
            await collectAndSubmitData();
        }, 30000); // 30 seconds interval
    };

    const collectAndSubmitData = async () => {
        try {
            const location = await getCurrentLocation();
            const qualityData: NetworkData = {
                signalStrength: -65 + Math.random() * 20,
                latency: 20 + Math.random() * 80,
                throughput: 500000 + Math.random() * 1500000,
                availability: 0.8 + Math.random() * 0.2,
                location,
            };

            await mockSolanaProgram.submitData(deviceId, qualityData);
            setNetworkData(qualityData);
            await loadDeviceStats();
        } catch (error) {
            console.error("Data submission failed:", error);
        }
    };

    const formatRewards = (tokens: number) => {
        return tokens.toFixed(2); // Format token rewards
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const startDemo = async () => {
        try {
            setIsDemoRunning(true);
            await demoSimulator.startDemo();
            Alert.alert(
                "Demo Started",
                "Demo simulation is running in the background"
            );
        } catch (error) {
            console.error("Demo failed:", error);
            Alert.alert("Demo Error", "Failed to start demo simulation");
        } finally {
            setIsDemoRunning(false);
        }
    };

    const stopDemo = () => {
        demoSimulator.stopDemo();
        setIsDemoRunning(false);
        Alert.alert("Demo Stopped", "Demo simulation has been stopped");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>DePINfinity</Text>
                    <Text style={styles.subtitle}>
                        Decentralized Mobile Infrastructure
                    </Text>
                    <View
                        style={[
                            styles.statusIndicator,
                            {
                                backgroundColor: isConnected
                                    ? "#28a745"
                                    : "#dc3545",
                            },
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {isConnected ? "Connected" : "Disconnected"}
                        </Text>
                    </View>
                </View>

                {/* Demo Controls */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Demo Controls</Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonHalf,
                                isDemoRunning
                                    ? styles.buttonDisabled
                                    : styles.buttonPrimary,
                            ]}
                            onPress={startDemo}
                            disabled={isDemoRunning}
                        >
                            <Text style={styles.buttonText}>Start Demo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonHalf,
                                styles.buttonSecondary,
                            ]}
                            onPress={stopDemo}
                        >
                            <Text style={styles.buttonText}>Stop Demo</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Device Registration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Device Registration</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={registerDevice}
                    >
                        <Text style={styles.buttonText}>Register Device</Text>
                    </TouchableOpacity>
                </View>

                {/* B2B Network Stats */}
                {b2bStats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            B2B Network Statistics
                        </Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    Data Points
                                </Text>
                                <Text style={styles.statValue}>
                                    {b2bStats.totalDataPoints}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    Active Agreements
                                </Text>
                                <Text style={styles.statValue}>
                                    {b2bStats.activeAgreements}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    Active Contracts
                                </Text>
                                <Text style={styles.statValue}>
                                    {b2bStats.activeContracts}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    Total Revenue
                                </Text>
                                <Text style={styles.statValue}>
                                    ${b2bStats.totalRevenue.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Device Stats */}
                {deviceStats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Device Statistics
                        </Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    Total Uptime
                                </Text>
                                <Text style={styles.statValue}>
                                    {deviceStats.totalUptime} sessions
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    Total Rewards
                                </Text>
                                <Text style={styles.statValue}>
                                    {formatRewards(
                                        deviceStats.totalRewardsEarned
                                    )}{" "}
                                    DOCOMO
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Status</Text>
                                <Text
                                    style={[
                                        styles.statValue,
                                        {
                                            color: deviceStats.isActive
                                                ? "#28a745"
                                                : "#dc3545",
                                        },
                                    ]}
                                >
                                    {deviceStats.isActive
                                        ? "Active"
                                        : "Inactive"}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    Last Activity
                                </Text>
                                <Text style={styles.statValue}>
                                    {formatTime(deviceStats.lastActivity)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Data Collection Controls */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Collection</Text>
                    <View style={styles.controlRow}>
                        <Text style={styles.controlLabel}>
                            Automatic Collection
                        </Text>
                        <Switch
                            value={isDataCollectionActive}
                            onValueChange={toggleDataCollection}
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={
                                isDataCollectionActive ? "#f5dd4b" : "#f4f3f4"
                            }
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={collectAndSubmitData}
                    >
                        <Text style={styles.buttonText}>Submit Data Now</Text>
                    </TouchableOpacity>
                </View>

                {/* Network Data Display */}
                {networkData && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Current Network Data
                        </Text>
                        <View style={styles.dataContainer}>
                            <View style={styles.dataItem}>
                                <Text style={styles.dataLabel}>
                                    Signal Strength
                                </Text>
                                <Text style={styles.dataValue}>
                                    {networkData.signalStrength.toFixed(1)} dBm
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <Text style={styles.dataLabel}>Latency</Text>
                                <Text style={styles.dataValue}>
                                    {networkData.latency.toFixed(0)} ms
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <Text style={styles.dataLabel}>Throughput</Text>
                                <Text style={styles.dataValue}>
                                    {(networkData.throughput / 1000000).toFixed(
                                        2
                                    )}{" "}
                                    Mbps
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <Text style={styles.dataLabel}>
                                    Availability
                                </Text>
                                <Text style={styles.dataValue}>
                                    {(networkData.availability * 100).toFixed(
                                        1
                                    )}
                                    %
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* How It Works */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoText}>
                            • Register your device to join the DePIN network
                        </Text>
                        <Text style={styles.infoText}>
                            • Enable automatic data collection to earn rewards
                        </Text>
                        <Text style={styles.infoText}>
                            • Your anonymized network data helps improve mobile
                            infrastructure
                        </Text>
                        <Text style={styles.infoText}>
                            • Earn DOCOMO tokens for contributing to the network
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: "#ffffff",
        padding: 20,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#e9ecef",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#212529",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: "#6c757d",
        marginBottom: 10,
    },
    statusIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: 12,
    },
    section: {
        backgroundColor: "#ffffff",
        margin: 10,
        padding: 20,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#212529",
        marginBottom: 15,
    },
    button: {
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    buttonHalf: {
        flex: 1,
        marginHorizontal: 5,
    },
    buttonPrimary: {
        backgroundColor: "#28a745",
    },
    buttonSecondary: {
        backgroundColor: "#dc3545",
    },
    buttonDisabled: {
        backgroundColor: "#6c757d",
        opacity: 0.6,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
    statsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statItem: {
        width: "48%",
        marginBottom: 15,
    },
    statLabel: {
        fontSize: 14,
        color: "#6c757d",
        marginBottom: 5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#212529",
    },
    controlRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    controlLabel: {
        fontSize: 16,
        color: "#212529",
    },
    dataContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    dataItem: {
        width: "48%",
        marginBottom: 15,
        padding: 10,
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
    },
    dataLabel: {
        fontSize: 12,
        color: "#6c757d",
        marginBottom: 5,
    },
    dataValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#212529",
    },
    infoContainer: {
        marginTop: 10,
    },
    infoText: {
        fontSize: 14,
        color: "#6c757d",
        marginBottom: 8,
        lineHeight: 20,
    },
});

export default App;
