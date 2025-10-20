package com.ntt.docomo.depinfinity.contracts

import net.corda.core.contracts.*
import net.corda.core.transactions.LedgerTransaction
import java.time.Instant

/**
 * Network Data Contract for DePINfinity Corda Integration
 * 
 * This contract manages the integration of anonymized network quality data
 * from the Solana DePIN to Corda's permissioned B2B network.
 */
class NetworkDataContract : Contract {
    companion object {
        const val ID = "com.ntt.docomo.depinfinity.contracts.NetworkDataContract"
    }

    interface Commands : CommandData {
        class Create : Commands
        class Update : Commands
        class Aggregate : Commands
    }

    override fun verify(tx: LedgerTransaction) {
        val command = tx.commands.requireSingleCommand<Commands>()
        when (command.value) {
            is Commands.Create -> verifyCreate(tx)
            is Commands.Update -> verifyUpdate(tx)
            is Commands.Aggregate -> verifyAggregate(tx)
        }
    }

    private fun verifyCreate(tx: LedgerTransaction) {
        requireThat {
            "No inputs should be consumed when creating network data" using (tx.inputs.isEmpty())
            "Only one output should be created" using (tx.outputs.size == 1)
            
            val output = tx.outputsOfType<NetworkDataState>().single()
            "Network data must have valid metrics" using (output.metrics.isValid())
            "Network data must have valid region" using (output.region.isValid())
            "Network data must have valid timestamp" using (output.timestamp.isAfter(Instant.EPOCH))
        }
    }

    private fun verifyUpdate(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when updating network data" using (tx.inputs.size == 1)
            "One output should be created when updating network data" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<NetworkDataState>().single()
            val output = tx.outputsOfType<NetworkDataState>().single()
            
            "Network data ID must remain the same" using (input.id == output.id)
            "Updated network data must have valid metrics" using (output.metrics.isValid())
            "Updated network data must have valid region" using (output.region.isValid())
        }
    }

    private fun verifyAggregate(tx: LedgerTransaction) {
        requireThat {
            "Multiple inputs should be consumed when aggregating" using (tx.inputs.size > 1)
            "One output should be created when aggregating" using (tx.outputs.size == 1)
            
            val inputs = tx.inputsOfType<NetworkDataState>()
            val output = tx.outputsOfType<NetworkDataState>().single()
            
            "All input data must be from the same region" using {
                inputs.map { it.region }.distinct().size == 1
            }
            "Aggregated data must have valid metrics" using (output.metrics.isValid())
            "Aggregated data must have valid region" using (output.region.isValid())
        }
    }
}

/**
 * Network Data State representing anonymized network quality data
 */
@BelongsToContract(NetworkDataContract::class)
data class NetworkDataState(
    val id: String,
    val region: NetworkRegion,
    val metrics: NetworkMetrics,
    val timestamp: Instant,
    val source: String = "solana_depin",
    val version: String = "1.0",
    val participants: List<net.corda.core.identity.Party>
) : ContractState {
    override val participants: List<net.corda.core.identity.Party> = this.participants
}

/**
 * Network Region data structure
 */
data class NetworkRegion(
    val latitude: Double,
    val longitude: Double,
    val radius: Double,
    val country: String,
    val city: String
) {
    fun isValid(): Boolean {
        return latitude in -90.0..90.0 && 
               longitude in -180.0..180.0 && 
               radius >= 0.0 &&
               country.isNotBlank() &&
               city.isNotBlank()
    }
}

/**
 * Network Metrics data structure
 */
data class NetworkMetrics(
    val averageSignalStrength: Double,
    val averageLatency: Double,
    val averageThroughput: Double,
    val averageAvailability: Double,
    val deviceCount: Int,
    val dataPoints: Int,
    val qualityScore: Double
) {
    fun isValid(): Boolean {
        return averageSignalStrength in -120.0..0.0 &&
               averageLatency >= 0.0 &&
               averageThroughput >= 0.0 &&
               averageAvailability in 0.0..1.0 &&
               deviceCount >= 0 &&
               dataPoints >= 0 &&
               qualityScore in 0.0..1.0
    }
}
