package com.ntt.docomo.depinfinity.contracts

import net.corda.core.contracts.*
import net.corda.core.transactions.LedgerTransaction
import java.time.Instant
import java.time.LocalDateTime

/**
 * Roaming Agreement Contract for B2B Mobile Infrastructure
 * 
 * This contract manages roaming agreements between NTT DOCOMO and other carriers,
 * enabling shared infrastructure access and revenue sharing based on network data.
 */
class RoamingAgreementContract : Contract {
    companion object {
        const val ID = "com.ntt.docomo.depinfinity.contracts.RoamingAgreementContract"
    }

    interface Commands : CommandData {
        class Create : Commands
        class Update : Commands
        class Execute : Commands
        class Terminate : Commands
    }

    override fun verify(tx: LedgerTransaction) {
        val command = tx.commands.requireSingleCommand<Commands>()
        when (command.value) {
            is Commands.Create -> verifyCreate(tx)
            is Commands.Update -> verifyUpdate(tx)
            is Commands.Execute -> verifyExecute(tx)
            is Commands.Terminate -> verifyTerminate(tx)
        }
    }

    private fun verifyCreate(tx: LedgerTransaction) {
        requireThat {
            "No inputs should be consumed when creating roaming agreement" using (tx.inputs.isEmpty())
            "One output should be created" using (tx.outputs.size == 1)
            
            val output = tx.outputsOfType<RoamingAgreementState>().single()
            "Agreement must have valid terms" using (output.terms.isValid())
            "Agreement must have valid duration" using (output.terms.duration > 0)
            "Agreement must have valid parties" using (output.participants.size >= 2)
        }
    }

    private fun verifyUpdate(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when updating agreement" using (tx.inputs.size == 1)
            "One output should be created when updating agreement" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<RoamingAgreementState>().single()
            val output = tx.outputsOfType<RoamingAgreementState>().single()
            
            "Agreement ID must remain the same" using (input.id == output.id)
            "Updated agreement must have valid terms" using (output.terms.isValid())
            "Agreement must not be expired" using (!output.isExpired())
        }
    }

    private fun verifyExecute(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when executing agreement" using (tx.inputs.size == 1)
            "One output should be created when executing agreement" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<RoamingAgreementState>().single()
            val output = tx.outputsOfType<RoamingAgreementState>().single()
            
            "Agreement must be active" using (input.status == AgreementStatus.ACTIVE)
            "Agreement must not be expired" using (!input.isExpired())
            "Execution must update last execution time" using (
                output.lastExecutionTime.isAfter(input.lastExecutionTime)
            )
        }
    }

    private fun verifyTerminate(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when terminating agreement" using (tx.inputs.size == 1)
            "One output should be created when terminating agreement" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<RoamingAgreementState>().single()
            val output = tx.outputsOfType<RoamingAgreementState>().single()
            
            "Agreement must be active to terminate" using (input.status == AgreementStatus.ACTIVE)
            "Status must change to terminated" using (output.status == AgreementStatus.TERMINATED)
            "Termination time must be set" using (output.terminationTime != null)
        }
    }
}

/**
 * Roaming Agreement State
 */
@BelongsToContract(RoamingAgreementContract::class)
data class RoamingAgreementState(
    val id: String,
    val partnerId: String,
    val region: String,
    val terms: AgreementTerms,
    val networkData: NetworkQualityData,
    val status: AgreementStatus,
    val creationTime: Instant,
    val lastExecutionTime: Instant,
    val terminationTime: Instant?,
    val participants: List<net.corda.core.identity.Party>
) : ContractState {
    override val participants: List<net.corda.core.identity.Party> = this.participants

    fun isExpired(): Boolean {
        return creationTime.plusSeconds(terms.duration * 86400) // Convert days to seconds
            .isBefore(Instant.now())
    }

    fun isActive(): Boolean {
        return status == AgreementStatus.ACTIVE && !isExpired()
    }
}

/**
 * Agreement Terms
 */
data class AgreementTerms(
    val dataSharing: Boolean,
    val infrastructureAccess: Boolean,
    val revenueSharing: Double, // Percentage
    val duration: Long, // Days
    val minimumQuality: Double,
    val coverageArea: Double,
    val performanceMetrics: List<String>
) {
    fun isValid(): Boolean {
        return revenueSharing in 0.0..100.0 &&
               duration > 0 &&
               minimumQuality in 0.0..1.0 &&
               coverageArea > 0.0 &&
               performanceMetrics.isNotEmpty()
    }
}

/**
 * Network Quality Data for Agreement
 */
data class NetworkQualityData(
    val averageQuality: Double,
    val coverageArea: Double,
    val deviceCount: Int,
    val lastUpdated: Instant
) {
    fun isValid(): Boolean {
        return averageQuality in 0.0..1.0 &&
               coverageArea > 0.0 &&
               deviceCount >= 0
    }
}

/**
 * Agreement Status Enum
 */
enum class AgreementStatus {
    PENDING,
    ACTIVE,
    SUSPENDED,
    TERMINATED,
    EXPIRED
}
