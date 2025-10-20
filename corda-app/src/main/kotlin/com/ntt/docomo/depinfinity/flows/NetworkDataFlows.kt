package com.ntt.docomo.depinfinity.flows

import co.paralleluniverse.fibers.Suspendable
import com.ntt.docomo.depinfinity.contracts.NetworkDataContract
import com.ntt.docomo.depinfinity.contracts.NetworkDataState
import com.ntt.docomo.depinfinity.contracts.NetworkMetrics
import com.ntt.docomo.depinfinity.contracts.NetworkRegion
import net.corda.core.contracts.Command
import net.corda.core.contracts.UniqueIdentifier
import net.corda.core.flows.*
import net.corda.core.identity.Party
import net.corda.core.transactions.SignedTransaction
import net.corda.core.transactions.TransactionBuilder
import net.corda.core.utilities.ProgressTracker
import java.time.Instant

/**
 * Flow to create network data from Solana DePIN integration
 */
@InitiatingFlow
@StartableByRPC
class CreateNetworkDataFlow(
    private val region: NetworkRegion,
    private val metrics: NetworkMetrics,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Creating network data state",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Creating network data state"
        
        val networkDataState = NetworkDataState(
            id = UniqueIdentifier().toString(),
            region = region,
            metrics = metrics,
            timestamp = Instant.now(),
            source = "solana_depin",
            version = "1.0",
            participants = participants
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(NetworkDataContract.Commands.Create(), participants.map { it.owningKey })
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addOutputState(networkDataState, NetworkDataContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to update existing network data
 */
@InitiatingFlow
@StartableByRPC
class UpdateNetworkDataFlow(
    private val networkDataId: String,
    private val newMetrics: NetworkMetrics,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving network data state",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving network data state"
        
        val networkDataState = serviceHub.vaultService.queryBy(NetworkDataState::class.java)
            .states.find { it.state.data.id == networkDataId }?.state?.data
            ?: throw IllegalArgumentException("Network data with ID $networkDataId not found")

        progressTracker.currentStep = "Building transaction"
        
        val updatedState = networkDataState.copy(metrics = newMetrics)
        val command = Command(NetworkDataContract.Commands.Update(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(NetworkDataState::class.java)
                .states.find { it.state.data.id == networkDataId }!!)
            .addOutputState(updatedState, NetworkDataContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to aggregate multiple network data points
 */
@InitiatingFlow
@StartableByRPC
class AggregateNetworkDataFlow(
    private val networkDataIds: List<String>,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving network data states",
        "Aggregating data",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving network data states"
        
        val networkDataStates = networkDataIds.map { id ->
            serviceHub.vaultService.queryBy(NetworkDataState::class.java)
                .states.find { it.state.data.id == id }?.state?.data
                ?: throw IllegalArgumentException("Network data with ID $id not found")
        }

        progressTracker.currentStep = "Aggregating data"
        
        val aggregatedMetrics = aggregateMetrics(networkDataStates.map { it.metrics })
        val aggregatedRegion = networkDataStates.first().region // Assume same region for aggregation
        
        val aggregatedState = NetworkDataState(
            id = UniqueIdentifier().toString(),
            region = aggregatedRegion,
            metrics = aggregatedMetrics,
            timestamp = Instant.now(),
            source = "solana_depin_aggregated",
            version = "1.0",
            participants = participants
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(NetworkDataContract.Commands.Aggregate(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .apply {
                networkDataStates.forEach { state ->
                    addInputState(serviceHub.vaultService.queryBy(NetworkDataState::class.java)
                        .states.find { it.state.data.id == state.id }!!)
                }
            }
            .addOutputState(aggregatedState, NetworkDataContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }

    private fun aggregateMetrics(metricsList: List<NetworkMetrics>): NetworkMetrics {
        val totalDataPoints = metricsList.sumBy { it.dataPoints }
        val totalDevices = metricsList.sumBy { it.deviceCount }
        
        val weightedSignalStrength = metricsList.map { it.averageSignalStrength * it.dataPoints }.sum() / totalDataPoints
        val weightedLatency = metricsList.map { it.averageLatency * it.dataPoints }.sum() / totalDataPoints
        val weightedThroughput = metricsList.map { it.averageThroughput * it.dataPoints }.sum() / totalDataPoints
        val weightedAvailability = metricsList.map { it.averageAvailability * it.dataPoints }.sum() / totalDataPoints
        val weightedQualityScore = metricsList.map { it.qualityScore * it.dataPoints }.sum() / totalDataPoints
        
        return NetworkMetrics(
            averageSignalStrength = weightedSignalStrength,
            averageLatency = weightedLatency,
            averageThroughput = weightedThroughput,
            averageAvailability = weightedAvailability,
            deviceCount = totalDevices,
            dataPoints = totalDataPoints,
            qualityScore = weightedQualityScore
        )
    }
}

/**
 * Flow to query network data by region
 */
@StartableByRPC
class QueryNetworkDataByRegionFlow(
    private val region: String
) : FlowLogic<List<NetworkDataState>>() {

    @Suspendable
    override fun call(): List<NetworkDataState> {
        return serviceHub.vaultService.queryBy(NetworkDataState::class.java)
            .states
            .map { it.state.data }
            .filter { it.region.city == region || it.region.country == region }
    }
}

/**
 * Flow to query network data by time range
 */
@StartableByRPC
class QueryNetworkDataByTimeRangeFlow(
    private val startTime: Instant,
    private val endTime: Instant
) : FlowLogic<List<NetworkDataState>>() {

    @Suspendable
    override fun call(): List<NetworkDataState> {
        return serviceHub.vaultService.queryBy(NetworkDataState::class.java)
            .states
            .map { it.state.data }
            .filter { it.timestamp.isAfter(startTime) && it.timestamp.isBefore(endTime) }
    }
}
