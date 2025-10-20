/**
 * Mock Corda Network for DePINfinity Demo
 *
 * This mock implementation simulates the Corda B2B network functionality
 * for hackathon demonstration purposes.
 */

import { EventEmitter } from "events";

export interface NetworkData {
    region: string;
    metrics: {
        averageSignalStrength: number;
        averageLatency: number;
        averageThroughput: number;
        averageAvailability: number;
        deviceCount: number;
        dataPoints: number;
    };
    timestamp: number;
}

export interface RoamingAgreement {
    id: string;
    partnerId: string;
    region: string;
    terms: {
        dataSharing: boolean;
        infrastructureAccess: boolean;
        revenueSharing: number;
        duration: number;
    };
    networkData: {
        averageQuality: number;
        coverageArea: number;
        deviceCount: number;
    };
    status: "PENDING" | "ACTIVE" | "SUSPENDED" | "TERMINATED";
    creationTime: number;
    lastExecutionTime: number;
}

export interface InfrastructureContract {
    id: string;
    partnerId: string;
    contractType: "TOWER_SHARING" | "FIBER_ACCESS" | "SPECTRUM_SHARING";
    terms: {
        duration: number;
        cost: number;
        costUnit: string;
        performanceMetrics: string[];
    };
    networkRequirements: {
        minimumQuality: number;
        coverageArea: number;
        uptimeRequirement: number;
    };
    status: "PENDING" | "ACTIVE" | "SUSPENDED" | "TERMINATED";
    creationTime: number;
    lastExecutionTime: number;
}

export interface B2BInsights {
    region: string;
    timeRange: {
        start: number;
        end: number;
    };
    metrics: {
        averageQuality: number;
        coverageDensity: number;
        performanceTrends: number[];
    };
    recommendations: {
        infrastructureInvestment: string[];
        partnershipOpportunities: string[];
        costOptimization: string[];
    };
}

class MockCordaNetwork extends EventEmitter {
    private networkData: NetworkData[] = [];
    private roamingAgreements: Map<string, RoamingAgreement> = new Map();
    private infrastructureContracts: Map<string, InfrastructureContract> =
        new Map();
    private isSimulating: boolean = false;

    constructor() {
        super();
        this.startB2BSimulation();
    }

    /**
     * Migrate network data from Solana
     */
    async migrateNetworkDataFromSolana(
        solanaData: any[],
        region: string
    ): Promise<string> {
        console.log(
            `🌉 Migrating ${solanaData.length} data points from Solana to Corda`
        );

        // Aggregate Solana data
        const aggregatedData: NetworkData = {
            region,
            metrics: this.aggregateMetrics(solanaData),
            timestamp: Date.now(),
        };

        this.networkData.push(aggregatedData);

        console.log(`📊 Network data migrated for region: ${region}`);
        this.emit("networkDataMigrated", aggregatedData);

        return "mock_corda_tx_migrate_123";
    }

    /**
     * Create roaming agreement
     */
    async createRoamingAgreement(
        partnerId: string,
        region: string,
        terms: any,
        networkData: any
    ): Promise<string> {
        const agreementId = `agreement_${Date.now()}`;

        const agreement: RoamingAgreement = {
            id: agreementId,
            partnerId,
            region,
            terms,
            networkData,
            status: "PENDING",
            creationTime: Date.now(),
            lastExecutionTime: Date.now(),
        };

        this.roamingAgreements.set(agreementId, agreement);

        console.log(
            `🤝 Roaming agreement created: ${agreementId} with ${partnerId}`
        );
        this.emit("roamingAgreementCreated", agreement);

        return agreementId;
    }

    /**
     * Create infrastructure contract
     */
    async createInfrastructureContract(
        partnerId: string,
        contractType: string,
        terms: any,
        networkRequirements: any
    ): Promise<string> {
        const contractId = `contract_${Date.now()}`;

        const contract: InfrastructureContract = {
            id: contractId,
            partnerId,
            contractType: contractType as any,
            terms,
            networkRequirements,
            status: "PENDING",
            creationTime: Date.now(),
            lastExecutionTime: Date.now(),
        };

        this.infrastructureContracts.set(contractId, contract);

        console.log(
            `🏗️ Infrastructure contract created: ${contractId} with ${partnerId}`
        );
        this.emit("infrastructureContractCreated", contract);

        return contractId;
    }

    /**
     * Execute roaming agreement
     */
    async executeRoamingAgreement(agreementId: string): Promise<string> {
        const agreement = this.roamingAgreements.get(agreementId);
        if (!agreement) {
            throw new Error("Roaming agreement not found");
        }

        if (agreement.status !== "ACTIVE") {
            throw new Error("Agreement is not active");
        }

        // Simulate agreement execution
        const revenue = this.calculateRevenue(agreement);
        agreement.lastExecutionTime = Date.now();

        console.log(
            `💰 Roaming agreement executed: ${agreementId}, revenue: ${revenue}`
        );
        this.emit("roamingAgreementExecuted", { agreement, revenue });

        return "mock_corda_tx_execute_agreement_123";
    }

    /**
     * Execute infrastructure contract
     */
    async executeInfrastructureContract(contractId: string): Promise<string> {
        const contract = this.infrastructureContracts.get(contractId);
        if (!contract) {
            throw new Error("Infrastructure contract not found");
        }

        if (contract.status !== "ACTIVE") {
            throw new Error("Contract is not active");
        }

        // Simulate contract execution
        const cost = this.calculateInfrastructureCost(contract);
        contract.lastExecutionTime = Date.now();

        console.log(
            `🏗️ Infrastructure contract executed: ${contractId}, cost: ${cost}`
        );
        this.emit("infrastructureContractExecuted", { contract, cost });

        return "mock_corda_tx_execute_contract_123";
    }

    /**
     * Get network insights for B2B decisions
     */
    async getNetworkInsights(
        region: string,
        startTime: number,
        endTime: number
    ): Promise<B2BInsights> {
        const relevantData = this.networkData.filter(
            (data) =>
                data.region === region &&
                data.timestamp >= startTime &&
                data.timestamp <= endTime
        );

        const insights: B2BInsights = {
            region,
            timeRange: { start: startTime, end: endTime },
            metrics: {
                averageQuality:
                    relevantData.length > 0
                        ? relevantData.reduce(
                              (sum, data) =>
                                  sum + data.metrics.averageAvailability,
                              0
                          ) / relevantData.length
                        : 0,
                coverageDensity:
                    relevantData.length > 0
                        ? relevantData.reduce(
                              (sum, data) => sum + data.metrics.deviceCount,
                              0
                          ) / relevantData.length
                        : 0,
                performanceTrends: relevantData.map(
                    (data) => data.metrics.averageAvailability
                ),
            },
            recommendations: this.generateRecommendations(relevantData),
        };

        console.log(`📈 Network insights generated for ${region}`);
        this.emit("networkInsightsGenerated", insights);

        return insights;
    }

    /**
     * Get active agreements
     */
    async getActiveAgreements(): Promise<{
        roamingAgreements: RoamingAgreement[];
        infrastructureContracts: InfrastructureContract[];
    }> {
        const activeRoamingAgreements = Array.from(
            this.roamingAgreements.values()
        ).filter((agreement) => agreement.status === "ACTIVE");

        const activeInfrastructureContracts = Array.from(
            this.infrastructureContracts.values()
        ).filter((contract) => contract.status === "ACTIVE");

        return {
            roamingAgreements: activeRoamingAgreements,
            infrastructureContracts: activeInfrastructureContracts,
        };
    }

    /**
     * Calculate revenue sharing
     */
    async calculateRevenueSharing(
        agreementId: string,
        usageData: { dataUsage: number; costPerMB: number }
    ): Promise<{
        totalRevenue: number;
        sharedRevenue: number;
        revenueSharingPercentage: number;
    }> {
        const agreement = this.roamingAgreements.get(agreementId);
        if (!agreement) {
            throw new Error("Roaming agreement not found");
        }

        const totalRevenue = usageData.dataUsage * usageData.costPerMB;
        const sharedRevenue =
            totalRevenue * (agreement.terms.revenueSharing / 100);

        return {
            totalRevenue,
            sharedRevenue,
            revenueSharingPercentage: agreement.terms.revenueSharing,
        };
    }

    /**
     * Aggregate metrics from Solana data
     */
    private aggregateMetrics(solanaData: any[]): any {
        if (solanaData.length === 0) {
            return {
                averageSignalStrength: 0,
                averageLatency: 0,
                averageThroughput: 0,
                averageAvailability: 0,
                deviceCount: 0,
                dataPoints: 0,
            };
        }

        return {
            averageSignalStrength:
                solanaData.reduce((sum, data) => sum + data.signalStrength, 0) /
                solanaData.length,
            averageLatency:
                solanaData.reduce((sum, data) => sum + data.latency, 0) /
                solanaData.length,
            averageThroughput:
                solanaData.reduce((sum, data) => sum + data.throughput, 0) /
                solanaData.length,
            averageAvailability:
                solanaData.reduce((sum, data) => sum + data.availability, 0) /
                solanaData.length,
            deviceCount: new Set(solanaData.map((data) => data.deviceId)).size,
            dataPoints: solanaData.length,
        };
    }

    /**
     * Calculate revenue for roaming agreement
     */
    private calculateRevenue(agreement: RoamingAgreement): number {
        const baseRevenue = agreement.networkData.deviceCount * 100; // Base revenue per device
        const qualityMultiplier = agreement.networkData.averageQuality;
        const coverageMultiplier = agreement.networkData.coverageArea / 1000;

        return baseRevenue * qualityMultiplier * coverageMultiplier;
    }

    /**
     * Calculate infrastructure cost
     */
    private calculateInfrastructureCost(
        contract: InfrastructureContract
    ): number {
        const baseCost = contract.terms.cost;
        const qualityMultiplier = contract.networkRequirements.minimumQuality;
        const coverageMultiplier =
            contract.networkRequirements.coverageArea / 1000;

        return baseCost * qualityMultiplier * coverageMultiplier;
    }

    /**
     * Generate B2B recommendations
     */
    private generateRecommendations(data: NetworkData[]): {
        infrastructureInvestment: string[];
        partnershipOpportunities: string[];
        costOptimization: string[];
    } {
        const avgQuality =
            data.length > 0
                ? data.reduce(
                      (sum, d) => sum + d.metrics.averageAvailability,
                      0
                  ) / data.length
                : 0;

        const recommendations = {
            infrastructureInvestment: [] as string[],
            partnershipOpportunities: [] as string[],
            costOptimization: [] as string[],
        };

        if (avgQuality < 0.6) {
            recommendations.infrastructureInvestment.push(
                "Invest in network infrastructure upgrades"
            );
            recommendations.infrastructureInvestment.push(
                "Deploy additional base stations"
            );
        }

        if (avgQuality > 0.8) {
            recommendations.partnershipOpportunities.push(
                "Offer premium roaming services"
            );
            recommendations.partnershipOpportunities.push(
                "Expand into adjacent markets"
            );
        }

        if (avgQuality > 0.9) {
            recommendations.costOptimization.push("Optimize network resources");
            recommendations.costOptimization.push(
                "Implement automated management"
            );
        }

        return recommendations;
    }

    /**
     * Start B2B simulation for demo
     */
    private startB2BSimulation(): void {
        if (this.isSimulating) return;

        this.isSimulating = true;

        // Simulate B2B transactions every 2 minutes
        setInterval(() => {
            this.simulateB2BTransactions();
        }, 120000);

        console.log("🔄 B2B simulation started");
    }

    /**
     * Simulate B2B transactions for demo
     */
    private simulateB2BTransactions(): void {
        const activeAgreements = Array.from(
            this.roamingAgreements.values()
        ).filter((agreement) => agreement.status === "ACTIVE");

        const activeContracts = Array.from(
            this.infrastructureContracts.values()
        ).filter((contract) => contract.status === "ACTIVE");

        // Simulate agreement execution
        if (activeAgreements.length > 0) {
            const randomAgreement =
                activeAgreements[
                    Math.floor(Math.random() * activeAgreements.length)
                ];
            this.executeRoamingAgreement(randomAgreement.id);
        }

        // Simulate contract execution
        if (activeContracts.length > 0) {
            const randomContract =
                activeContracts[
                    Math.floor(Math.random() * activeContracts.length)
                ];
            this.executeInfrastructureContract(randomContract.id);
        }
    }

    /**
     * Get network statistics
     */
    getNetworkStats(): {
        totalDataPoints: number;
        activeAgreements: number;
        activeContracts: number;
        totalRevenue: number;
    } {
        const activeAgreements = Array.from(
            this.roamingAgreements.values()
        ).filter((agreement) => agreement.status === "ACTIVE");

        const activeContracts = Array.from(
            this.infrastructureContracts.values()
        ).filter((contract) => contract.status === "ACTIVE");

        return {
            totalDataPoints: this.networkData.length,
            activeAgreements: activeAgreements.length,
            activeContracts: activeContracts.length,
            totalRevenue: activeAgreements.reduce(
                (sum, agreement) => sum + this.calculateRevenue(agreement),
                0
            ),
        };
    }

    /**
     * Reset network state for demo
     */
    reset(): void {
        this.networkData = [];
        this.roamingAgreements.clear();
        this.infrastructureContracts.clear();
        console.log("🔄 Mock Corda network reset");
    }
}

// Export singleton instance
export const mockCordaNetwork = new MockCordaNetwork();
export default mockCordaNetwork;
