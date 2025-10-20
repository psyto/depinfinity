package com.ntt.docomo.depinfinity.api

import com.ntt.docomo.depinfinity.contracts.*
import com.ntt.docomo.depinfinity.flows.*
import com.ntt.docomo.depinfinity.services.*
import net.corda.core.contracts.UniqueIdentifier
import net.corda.core.flows.FlowLogic
import net.corda.core.flows.StartableByRPC
import net.corda.core.identity.Party
import net.corda.core.node.services.Vault
import net.corda.core.node.services.vault.QueryCriteria
import java.time.Instant

/**
 * Corda API Server for DePINfinity B2B Integration
 * 
 * This server provides REST API endpoints for external systems to interact
 * with the Corda network for B2B transactions and data integration.
 */
class CordaAPIServer : FlowLogic<Unit>() {

    /**
     * Create network data from Solana DePIN
     */
    @StartableByRPC
    class CreateNetworkDataFromSolanaAPI(
        private val request: SolanaDataRequest
    ) : FlowLogic<NetworkDataResponse>() {

        @Suspendable
        override fun call(): NetworkDataResponse {
            try {
                val solanaData = SolanaNetworkData(
                    region = SolanaRegion(
                        latitude = request.region.latitude,
                        longitude = request.region.longitude,
                        radius = request.region.radius,
                        country = request.region.country,
                        city = request.region.city
                    ),
                    metrics = SolanaNetworkMetrics(
                        averageSignalStrength = request.metrics.averageSignalStrength,
                        averageLatency = request.metrics.averageLatency,
                        averageThroughput = request.metrics.averageThroughput,
                        averageAvailability = request.metrics.averageAvailability,
                        deviceCount = request.metrics.deviceCount,
                        dataPoints = request.metrics.dataPoints
                    ),
                    timestamp = Instant.now()
                )

                val networkDataState = subFlow(NetworkDataService.CreateNetworkDataFromSolana(
                    solanaData, request.participants
                ))

                return NetworkDataResponse(
                    success = true,
                    networkDataId = networkDataState.id,
                    message = "Network data created successfully"
                )
            } catch (e: Exception) {
                return NetworkDataResponse(
                    success = false,
                    networkDataId = null,
                    message = "Failed to create network data: ${e.message}"
                )
            }
        }
    }

    /**
     * Get network insights for B2B decisions
     */
    @StartableByRPC
    class GetNetworkInsightsAPI(
        private val region: String,
        private val startTime: Instant,
        private val endTime: Instant
    ) : FlowLogic<NetworkInsightsResponse>() {

        @Suspendable
        override fun call(): NetworkInsightsResponse {
            try {
                val timeRange = TimeRange(startTime, endTime)
                val insights = subFlow(B2BAnalyticsService.GenerateNetworkInsights(region, timeRange))

                return NetworkInsightsResponse(
                    success = true,
                    insights = insights,
                    message = "Network insights generated successfully"
                )
            } catch (e: Exception) {
                return NetworkInsightsResponse(
                    success = false,
                    insights = null,
                    message = "Failed to generate network insights: ${e.message}"
                )
            }
        }
    }

    /**
     * Create roaming agreement
     */
    @StartableByRPC
    class CreateRoamingAgreementAPI(
        private val request: RoamingAgreementRequest
    ) : FlowLogic<RoamingAgreementResponse>() {

        @Suspendable
        override fun call(): RoamingAgreementResponse {
            try {
                val terms = AgreementTerms(
                    dataSharing = request.terms.dataSharing,
                    infrastructureAccess = request.terms.infrastructureAccess,
                    revenueSharing = request.terms.revenueSharing,
                    duration = request.terms.duration,
                    minimumQuality = request.terms.minimumQuality,
                    coverageArea = request.terms.coverageArea,
                    performanceMetrics = request.terms.performanceMetrics
                )

                val networkData = NetworkQualityData(
                    averageQuality = request.networkData.averageQuality,
                    coverageArea = request.networkData.coverageArea,
                    deviceCount = request.networkData.deviceCount,
                    lastUpdated = Instant.now()
                )

                val agreementState = subFlow(CreateRoamingAgreementFlow(
                    request.partnerId,
                    request.region,
                    terms,
                    networkData,
                    request.participants
                ))

                return RoamingAgreementResponse(
                    success = true,
                    agreementId = agreementState.id,
                    message = "Roaming agreement created successfully"
                )
            } catch (e: Exception) {
                return RoamingAgreementResponse(
                    success = false,
                    agreementId = null,
                    message = "Failed to create roaming agreement: ${e.message}"
                )
            }
        }
    }

    /**
     * Create infrastructure contract
     */
    @StartableByRPC
    class CreateInfrastructureContractAPI(
        private val request: InfrastructureContractRequest
    ) : FlowLogic<InfrastructureContractResponse>() {

        @Suspendable
        override fun call(): InfrastructureContractResponse {
            try {
                val terms = InfrastructureTerms(
                    duration = request.terms.duration,
                    cost = request.terms.cost,
                    costUnit = request.terms.costUnit,
                    performanceMetrics = request.terms.performanceMetrics,
                    serviceLevelAgreement = ServiceLevelAgreement(
                        uptimeRequirement = request.terms.serviceLevelAgreement.uptimeRequirement,
                        responseTimeRequirement = request.terms.serviceLevelAgreement.responseTimeRequirement,
                        availabilityRequirement = request.terms.serviceLevelAgreement.availabilityRequirement,
                        penaltyClause = request.terms.serviceLevelAgreement.penaltyClause
                    ),
                    paymentTerms = PaymentTerms(
                        paymentFrequency = request.terms.paymentTerms.paymentFrequency,
                        paymentMethod = request.terms.paymentTerms.paymentMethod,
                        currency = request.terms.paymentTerms.currency,
                        latePaymentPenalty = request.terms.paymentTerms.latePaymentPenalty
                    )
                )

                val networkRequirements = NetworkRequirements(
                    minimumQuality = request.networkRequirements.minimumQuality,
                    coverageArea = request.networkRequirements.coverageArea,
                    uptimeRequirement = request.networkRequirements.uptimeRequirement,
                    bandwidthRequirement = request.networkRequirements.bandwidthRequirement,
                    latencyRequirement = request.networkRequirements.latencyRequirement
                )

                val contractState = subFlow(CreateInfrastructureContractFlow(
                    request.partnerId,
                    request.contractType,
                    terms,
                    networkRequirements,
                    request.participants
                ))

                return InfrastructureContractResponse(
                    success = true,
                    contractId = contractState.id,
                    message = "Infrastructure contract created successfully"
                )
            } catch (e: Exception) {
                return InfrastructureContractResponse(
                    success = false,
                    contractId = null,
                    message = "Failed to create infrastructure contract: ${e.message}"
                )
            }
        }
    }

    /**
     * Query active agreements and contracts
     */
    @StartableByRPC
    class QueryActiveAgreementsAPI : FlowLogic<ActiveAgreementsResponse>() {

        @Suspendable
        override fun call(): ActiveAgreementsResponse {
            try {
                val activeRoamingAgreements = subFlow(QueryActiveRoamingAgreementsFlow())
                val activeInfrastructureContracts = subFlow(QueryActiveInfrastructureContractsFlow())

                return ActiveAgreementsResponse(
                    success = true,
                    roamingAgreements = activeRoamingAgreements,
                    infrastructureContracts = activeInfrastructureContracts,
                    message = "Active agreements retrieved successfully"
                )
            } catch (e: Exception) {
                return ActiveAgreementsResponse(
                    success = false,
                    roamingAgreements = emptyList(),
                    infrastructureContracts = emptyList(),
                    message = "Failed to retrieve active agreements: ${e.message}"
                )
            }
        }
    }

    /**
     * Calculate revenue sharing for roaming agreement
     */
    @StartableByRPC
    class CalculateRevenueSharingAPI(
        private val agreementId: String,
        private val usageData: UsageData
    ) : FlowLogic<RevenueSharingResponse>() {

        @Suspendable
        override fun call(): RevenueSharingResponse {
            try {
                val revenueSharingResult = subFlow(CalculateRevenueSharingFlow(agreementId, usageData))

                return RevenueSharingResponse(
                    success = true,
                    result = revenueSharingResult,
                    message = "Revenue sharing calculated successfully"
                )
            } catch (e: Exception) {
                return RevenueSharingResponse(
                    success = false,
                    result = null,
                    message = "Failed to calculate revenue sharing: ${e.message}"
                )
            }
        }
    }

    /**
     * Calculate infrastructure costs
     */
    @StartableByRPC
    class CalculateInfrastructureCostsAPI(
        private val contractId: String,
        private val usageData: InfrastructureUsageData
    ) : FlowLogic<InfrastructureCostsResponse>() {

        @Suspendable
        override fun call(): InfrastructureCostsResponse {
            try {
                val costResult = subFlow(CalculateInfrastructureCostsFlow(contractId, usageData))

                return InfrastructureCostsResponse(
                    success = true,
                    result = costResult,
                    message = "Infrastructure costs calculated successfully"
                )
            } catch (e: Exception) {
                return InfrastructureCostsResponse(
                    success = false,
                    result = null,
                    message = "Failed to calculate infrastructure costs: ${e.message}"
                )
            }
        }
    }
}

/**
 * API Request/Response Data Classes
 */
data class SolanaDataRequest(
    val region: SolanaRegionRequest,
    val metrics: SolanaMetricsRequest,
    val participants: List<Party>
)

data class SolanaRegionRequest(
    val latitude: Double,
    val longitude: Double,
    val radius: Double,
    val country: String,
    val city: String
)

data class SolanaMetricsRequest(
    val averageSignalStrength: Double,
    val averageLatency: Double,
    val averageThroughput: Double,
    val averageAvailability: Double,
    val deviceCount: Int,
    val dataPoints: Int
)

data class NetworkDataResponse(
    val success: Boolean,
    val networkDataId: String?,
    val message: String
)

data class NetworkInsightsResponse(
    val success: Boolean,
    val insights: NetworkInsights?,
    val message: String
)

data class RoamingAgreementRequest(
    val partnerId: String,
    val region: String,
    val terms: AgreementTermsRequest,
    val networkData: NetworkQualityDataRequest,
    val participants: List<Party>
)

data class AgreementTermsRequest(
    val dataSharing: Boolean,
    val infrastructureAccess: Boolean,
    val revenueSharing: Double,
    val duration: Long,
    val minimumQuality: Double,
    val coverageArea: Double,
    val performanceMetrics: List<String>
)

data class NetworkQualityDataRequest(
    val averageQuality: Double,
    val coverageArea: Double,
    val deviceCount: Int
)

data class RoamingAgreementResponse(
    val success: Boolean,
    val agreementId: String?,
    val message: String
)

data class InfrastructureContractRequest(
    val partnerId: String,
    val contractType: ContractType,
    val terms: InfrastructureTermsRequest,
    val networkRequirements: NetworkRequirementsRequest,
    val participants: List<Party>
)

data class InfrastructureTermsRequest(
    val duration: Long,
    val cost: java.math.BigDecimal,
    val costUnit: String,
    val performanceMetrics: List<String>,
    val serviceLevelAgreement: ServiceLevelAgreementRequest,
    val paymentTerms: PaymentTermsRequest
)

data class ServiceLevelAgreementRequest(
    val uptimeRequirement: Double,
    val responseTimeRequirement: Long,
    val availabilityRequirement: Double,
    val penaltyClause: String
)

data class PaymentTermsRequest(
    val paymentFrequency: PaymentFrequency,
    val paymentMethod: String,
    val currency: String,
    val latePaymentPenalty: Double
)

data class NetworkRequirementsRequest(
    val minimumQuality: Double,
    val coverageArea: Double,
    val uptimeRequirement: Double,
    val bandwidthRequirement: Long,
    val latencyRequirement: Long
)

data class InfrastructureContractResponse(
    val success: Boolean,
    val contractId: String?,
    val message: String
)

data class ActiveAgreementsResponse(
    val success: Boolean,
    val roamingAgreements: List<RoamingAgreementState>,
    val infrastructureContracts: List<InfrastructureContractState>,
    val message: String
)

data class RevenueSharingResponse(
    val success: Boolean,
    val result: RevenueSharingResult?,
    val message: String
)

data class InfrastructureCostsResponse(
    val success: Boolean,
    val result: InfrastructureCostResult?,
    val message: String
)
