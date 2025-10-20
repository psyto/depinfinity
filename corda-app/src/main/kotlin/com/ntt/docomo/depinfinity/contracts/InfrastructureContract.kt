package com.ntt.docomo.depinfinity.contracts

import net.corda.core.contracts.*
import net.corda.core.transactions.LedgerTransaction
import java.time.Instant
import java.math.BigDecimal

/**
 * Infrastructure Sharing Contract for B2B Mobile Infrastructure
 * 
 * This contract manages infrastructure sharing agreements between NTT DOCOMO
 * and other carriers, including tower sharing, fiber access, and spectrum sharing.
 */
class InfrastructureContract : Contract {
    companion object {
        const val ID = "com.ntt.docomo.depinfinity.contracts.InfrastructureContract"
    }

    interface Commands : CommandData {
        class Create : Commands
        class Update : Commands
        class Execute : Commands
        class Settle : Commands
        class Terminate : Commands
    }

    override fun verify(tx: LedgerTransaction) {
        val command = tx.commands.requireSingleCommand<Commands>()
        when (command.value) {
            is Commands.Create -> verifyCreate(tx)
            is Commands.Update -> verifyUpdate(tx)
            is Commands.Execute -> verifyExecute(tx)
            is Commands.Settle -> verifySettle(tx)
            is Commands.Terminate -> verifyTerminate(tx)
        }
    }

    private fun verifyCreate(tx: LedgerTransaction) {
        requireThat {
            "No inputs should be consumed when creating infrastructure contract" using (tx.inputs.isEmpty())
            "One output should be created" using (tx.outputs.size == 1)
            
            val output = tx.outputsOfType<InfrastructureContractState>().single()
            "Contract must have valid terms" using (output.terms.isValid())
            "Contract must have valid network requirements" using (output.networkRequirements.isValid())
            "Contract must have valid parties" using (output.participants.size >= 2)
        }
    }

    private fun verifyUpdate(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when updating contract" using (tx.inputs.size == 1)
            "One output should be created when updating contract" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<InfrastructureContractState>().single()
            val output = tx.outputsOfType<InfrastructureContractState>().single()
            
            "Contract ID must remain the same" using (input.id == output.id)
            "Updated contract must have valid terms" using (output.terms.isValid())
            "Contract must be active" using (output.status == ContractStatus.ACTIVE)
        }
    }

    private fun verifyExecute(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when executing contract" using (tx.inputs.size == 1)
            "One output should be created when executing contract" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<InfrastructureContractState>().single()
            val output = tx.outputsOfType<InfrastructureContractState>().single()
            
            "Contract must be active" using (input.status == ContractStatus.ACTIVE)
            "Contract must not be expired" using (!input.isExpired())
            "Execution must update last execution time" using (
                output.lastExecutionTime.isAfter(input.lastExecutionTime)
            )
        }
    }

    private fun verifySettle(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when settling contract" using (tx.inputs.size == 1)
            "One output should be created when settling contract" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<InfrastructureContractState>().single()
            val output = tx.outputsOfType<InfrastructureContractState>().single()
            
            "Contract must be active" using (input.status == ContractStatus.ACTIVE)
            "Settlement must update last settlement time" using (
                output.lastSettlementTime.isAfter(input.lastSettlementTime)
            )
        }
    }

    private fun verifyTerminate(tx: LedgerTransaction) {
        requireThat {
            "One input should be consumed when terminating contract" using (tx.inputs.size == 1)
            "One output should be created when terminating contract" using (tx.outputs.size == 1)
            
            val input = tx.inputsOfType<InfrastructureContractState>().single()
            val output = tx.outputsOfType<InfrastructureContractState>().single()
            
            "Contract must be active to terminate" using (input.status == ContractStatus.ACTIVE)
            "Status must change to terminated" using (output.status == ContractStatus.TERMINATED)
            "Termination time must be set" using (output.terminationTime != null)
        }
    }
}

/**
 * Infrastructure Contract State
 */
@BelongsToContract(InfrastructureContract::class)
data class InfrastructureContractState(
    val id: String,
    val partnerId: String,
    val contractType: ContractType,
    val terms: InfrastructureTerms,
    val networkRequirements: NetworkRequirements,
    val status: ContractStatus,
    val creationTime: Instant,
    val lastExecutionTime: Instant,
    val lastSettlementTime: Instant,
    val terminationTime: Instant?,
    val participants: List<net.corda.core.identity.Party>
) : ContractState {
    override val participants: List<net.corda.core.identity.Party> = this.participants

    fun isExpired(): Boolean {
        return creationTime.plusSeconds(terms.duration * 86400) // Convert days to seconds
            .isBefore(Instant.now())
    }

    fun isActive(): Boolean {
        return status == ContractStatus.ACTIVE && !isExpired()
    }
}

/**
 * Contract Type Enum
 */
enum class ContractType {
    TOWER_SHARING,
    FIBER_ACCESS,
    SPECTRUM_SHARING,
    BACKHAUL_SHARING,
    CO_LOCATION
}

/**
 * Infrastructure Terms
 */
data class InfrastructureTerms(
    val duration: Long, // Days
    val cost: BigDecimal,
    val costUnit: String, // JPY, USD, etc.
    val performanceMetrics: List<String>,
    val serviceLevelAgreement: ServiceLevelAgreement,
    val paymentTerms: PaymentTerms
) {
    fun isValid(): Boolean {
        return duration > 0 &&
               cost >= BigDecimal.ZERO &&
               costUnit.isNotBlank() &&
               performanceMetrics.isNotEmpty() &&
               serviceLevelAgreement.isValid() &&
               paymentTerms.isValid()
    }
}

/**
 * Service Level Agreement
 */
data class ServiceLevelAgreement(
    val uptimeRequirement: Double, // Percentage
    val responseTimeRequirement: Long, // Milliseconds
    val availabilityRequirement: Double, // Percentage
    val penaltyClause: String
) {
    fun isValid(): Boolean {
        return uptimeRequirement in 0.0..100.0 &&
               responseTimeRequirement > 0 &&
               availabilityRequirement in 0.0..100.0 &&
               penaltyClause.isNotBlank()
    }
}

/**
 * Payment Terms
 */
data class PaymentTerms(
    val paymentFrequency: PaymentFrequency,
    val paymentMethod: String,
    val currency: String,
    val latePaymentPenalty: Double // Percentage
) {
    fun isValid(): Boolean {
        return paymentFrequency != null &&
               paymentMethod.isNotBlank() &&
               currency.isNotBlank() &&
               latePaymentPenalty >= 0.0
    }
}

/**
 * Payment Frequency Enum
 */
enum class PaymentFrequency {
    MONTHLY,
    QUARTERLY,
    ANNUALLY,
    ON_DEMAND
}

/**
 * Network Requirements
 */
data class NetworkRequirements(
    val minimumQuality: Double,
    val coverageArea: Double,
    val uptimeRequirement: Double,
    val bandwidthRequirement: Long, // Mbps
    val latencyRequirement: Long // Milliseconds
) {
    fun isValid(): Boolean {
        return minimumQuality in 0.0..1.0 &&
               coverageArea > 0.0 &&
               uptimeRequirement in 0.0..100.0 &&
               bandwidthRequirement > 0 &&
               latencyRequirement > 0
    }
}

/**
 * Contract Status Enum
 */
enum class ContractStatus {
    PENDING,
    ACTIVE,
    SUSPENDED,
    TERMINATED,
    EXPIRED
}
