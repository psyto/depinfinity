package com.ntt.docomo.depinfinity.services

import com.ntt.docomo.depinfinity.contracts.NetworkDataState
import com.ntt.docomo.depinfinity.contracts.NetworkMetrics
import com.ntt.docomo.depinfinity.contracts.NetworkRegion
import net.corda.core.contracts.UniqueIdentifier
import net.corda.core.flows.FlowLogic
import net.corda.core.flows.StartableByRPC
import net.corda.core.identity.Party
import net.corda.core.node.services.Vault
import net.corda.core.node.services.vault.QueryCriteria
import net.corda.core.node.services.vault.builder
import java.time.Instant

/**
 * Network Data Service for DePINfinity Corda Integration
 * 
 * This service provides business logic for managing network data
 * integration from Solana DePIN to Corda B2B network.
 */
class NetworkDataService : FlowLogic<Unit>() {

    /**
     * Create network data from Solana DePIN integration
     */
    @StartableByRPC
    class CreateNetworkDataFromSolana(
        private val solanaData: SolanaNetworkData,
        private val participants: List<Party>
    ) : FlowLogic<NetworkDataState>() {

        @Suspendable
        override fun call(): NetworkDataState {
            val networkRegion = NetworkRegion(
                latitude = solanaData.region.latitude,
                longitude = solanaData.region.longitude,
                radius = solanaData.region.radius,
                country = solanaData.region.country,
                city = solanaData.region.city
            )

            val networkMetrics = NetworkMetrics(
                averageSignalStrength = solanaData.metrics.averageSignalStrength,
                averageLatency = solanaData.metrics.averageLatency,
                averageThroughput = solanaData.metrics.averageThroughput,
                averageAvailability = solanaData.metrics.averageAvailability,
                deviceCount = solanaData.metrics.deviceCount,
                dataPoints = solanaData.metrics.dataPoints,
                qualityScore = calculateQualityScore(solanaData.metrics)
            )

            return NetworkDataState(
                id = UniqueIdentifier().toString(),
                region = networkRegion,
                metrics = networkMetrics,
                timestamp = Instant.now(),
                source = "solana_depin",
                version = "1.0",
                participants = participants
            )
        }

        private fun calculateQualityScore(metrics: SolanaNetworkMetrics): Double {
            val signalScore = normalizeSignalStrength(metrics.averageSignalStrength)
            val latencyScore = normalizeLatency(metrics.averageLatency)
            val throughputScore = normalizeThroughput(metrics.averageThroughput)
            val availabilityScore = metrics.averageAvailability

            return (signalScore + latencyScore + throughputScore + availabilityScore) / 4.0
        }

        private fun normalizeSignalStrength(signalStrength: Double): Double {
            return when {
                signalStrength >= -50 -> 1.0
                signalStrength >= -60 -> 0.9
                signalStrength >= -70 -> 0.8
                signalStrength >= -80 -> 0.6
                signalStrength >= -90 -> 0.4
                else -> 0.2
            }
        }

        private fun normalizeLatency(latency: Double): Double {
            return when {
                latency <= 20 -> 1.0
                latency <= 50 -> 0.9
                latency <= 100 -> 0.8
                latency <= 200 -> 0.6
                latency <= 500 -> 0.4
                else -> 0.2
            }
        }

        private fun normalizeThroughput(throughput: Double): Double {
            return when {
                throughput >= 1000000 -> 1.0 // 1 Mbps
                throughput >= 500000 -> 0.8
                throughput >= 100000 -> 0.6
                throughput >= 50000 -> 0.4
                else -> 0.2
            }
        }
    }

    /**
     * Aggregate network data for B2B insights
     */
    @StartableByRPC
    class AggregateNetworkDataForB2B(
        private val region: String,
        private val timeRange: TimeRange
    ) : FlowLogic<B2BNetworkInsights>() {

        @Suspendable
        override fun call(): B2BNetworkInsights {
            val criteria = QueryCriteria.VaultQueryCriteria(
                status = Vault.StateStatus.UNCONSUMED
            )

            val networkDataStates = serviceHub.vaultService.queryBy(
                NetworkDataState::class.java,
                criteria
            ).states.map { it.state.data }

            val filteredData = networkDataStates.filter { data ->
                (data.region.city == region || data.region.country == region) &&
                data.timestamp.isAfter(timeRange.start) &&
                data.timestamp.isBefore(timeRange.end)
            }

            return B2BNetworkInsights(
                region = region,
                timeRange = timeRange,
                totalDataPoints = filteredData.sumBy { it.metrics.dataPoints },
                totalDevices = filteredData.sumBy { it.metrics.deviceCount },
                averageQuality = filteredData.map { it.metrics.qualityScore }.average(),
                coverageDensity = calculateCoverageDensity(filteredData),
                performanceTrends = calculatePerformanceTrends(filteredData),
                recommendations = generateRecommendations(filteredData)
            )
        }

        private fun calculateCoverageDensity(data: List<NetworkDataState>): Double {
            if (data.isEmpty()) return 0.0
            
            val totalArea = data.sumByDouble { Math.PI * it.region.radius * it.region.radius }
            val totalDevices = data.sumBy { it.metrics.deviceCount }
            
            return totalDevices / totalArea
        }

        private fun calculatePerformanceTrends(data: List<NetworkDataState>): List<Double> {
            return data.sortedBy { it.timestamp }
                .map { it.metrics.qualityScore }
                .chunked(10) // Group by time periods
                .map { it.average() }
        }

        private fun generateRecommendations(data: List<NetworkDataState>): List<String> {
            val recommendations = mutableListOf<String>()
            
            val avgQuality = data.map { it.metrics.qualityScore }.average()
            val avgCoverage = calculateCoverageDensity(data)
            
            when {
                avgQuality < 0.6 -> recommendations.add("Consider infrastructure investment in low-quality areas")
                avgCoverage < 0.1 -> recommendations.add("Expand network coverage in underserved areas")
                data.size < 10 -> recommendations.add("Increase data collection frequency")
                else -> recommendations.add("Network performance is optimal")
            }
            
            return recommendations
        }
    }

    /**
     * Query network data for B2B decision making
     */
    @StartableByRPC
    class QueryNetworkDataForB2B(
        private val queryCriteria: B2BQueryCriteria
    ) : FlowLogic<List<NetworkDataState>>() {

        @Suspendable
        override fun call(): List<NetworkDataState> {
            val criteria = QueryCriteria.VaultQueryCriteria(
                status = Vault.StateStatus.UNCONSUMED
            )

            val networkDataStates = serviceHub.vaultService.queryBy(
                NetworkDataState::class.java,
                criteria
            ).states.map { it.state.data }

            return networkDataStates.filter { data ->
                when {
                    queryCriteria.region != null -> data.region.city == queryCriteria.region || 
                                                   data.region.country == queryCriteria.region
                    queryCriteria.timeRange != null -> data.timestamp.isAfter(queryCriteria.timeRange.start) &&
                                                      data.timestamp.isBefore(queryCriteria.timeRange.end)
                    queryCriteria.minQuality != null -> data.metrics.qualityScore >= queryCriteria.minQuality
                    else -> true
                }
            }
        }
    }
}

/**
 * Solana Network Data Structure
 */
data class SolanaNetworkData(
    val region: SolanaRegion,
    val metrics: SolanaNetworkMetrics,
    val timestamp: Instant
)

data class SolanaRegion(
    val latitude: Double,
    val longitude: Double,
    val radius: Double,
    val country: String,
    val city: String
)

data class SolanaNetworkMetrics(
    val averageSignalStrength: Double,
    val averageLatency: Double,
    val averageThroughput: Double,
    val averageAvailability: Double,
    val deviceCount: Int,
    val dataPoints: Int
)

/**
 * B2B Network Insights
 */
data class B2BNetworkInsights(
    val region: String,
    val timeRange: TimeRange,
    val totalDataPoints: Int,
    val totalDevices: Int,
    val averageQuality: Double,
    val coverageDensity: Double,
    val performanceTrends: List<Double>,
    val recommendations: List<String>
)

/**
 * Time Range
 */
data class TimeRange(
    val start: Instant,
    val end: Instant
)

/**
 * B2B Query Criteria
 */
data class B2BQueryCriteria(
    val region: String? = null,
    val timeRange: TimeRange? = null,
    val minQuality: Double? = null
)
