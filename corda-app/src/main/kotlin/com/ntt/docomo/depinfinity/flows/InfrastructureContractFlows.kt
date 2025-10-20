package com.ntt.docomo.depinfinity.flows

import co.paralleluniverse.fibers.Suspendable
import com.ntt.docomo.depinfinity.contracts.*
import net.corda.core.contracts.Command
import net.corda.core.contracts.UniqueIdentifier
import net.corda.core.flows.*
import net.corda.core.identity.Party
import net.corda.core.transactions.SignedTransaction
import net.corda.core.transactions.TransactionBuilder
import net.corda.core.utilities.ProgressTracker
import java.math.BigDecimal
import java.time.Instant

/**
 * Flow to create an infrastructure contract
 */
@InitiatingFlow
@StartableByRPC
class CreateInfrastructureContractFlow(
    private val partnerId: String,
    private val contractType: ContractType,
    private val terms: InfrastructureTerms,
    private val networkRequirements: NetworkRequirements,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Creating infrastructure contract state",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Creating infrastructure contract state"
        
        val infrastructureContractState = InfrastructureContractState(
            id = UniqueIdentifier().toString(),
            partnerId = partnerId,
            contractType = contractType,
            terms = terms,
            networkRequirements = networkRequirements,
            status = ContractStatus.PENDING,
            creationTime = Instant.now(),
            lastExecutionTime = Instant.now(),
            lastSettlementTime = Instant.now(),
            terminationTime = null,
            participants = participants
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(InfrastructureContract.Commands.Create(), participants.map { it.owningKey })
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addOutputState(infrastructureContractState, InfrastructureContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to activate an infrastructure contract
 */
@InitiatingFlow
@StartableByRPC
class ActivateInfrastructureContractFlow(
    private val contractId: String,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving infrastructure contract state",
        "Activating contract",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving infrastructure contract state"
        
        val contractState = serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
            .states.find { it.state.data.id == contractId }?.state?.data
            ?: throw IllegalArgumentException("Infrastructure contract with ID $contractId not found")

        progressTracker.currentStep = "Activating contract"
        
        val activatedState = contractState.copy(
            status = ContractStatus.ACTIVE,
            lastExecutionTime = Instant.now()
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(InfrastructureContract.Commands.Update(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
                .states.find { it.state.data.id == contractId }!!)
            .addOutputState(activatedState, InfrastructureContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to execute an infrastructure contract
 */
@InitiatingFlow
@StartableByRPC
class ExecuteInfrastructureContractFlow(
    private val contractId: String,
    private val executionData: InfrastructureExecutionData,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving infrastructure contract state",
        "Executing contract",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving infrastructure contract state"
        
        val contractState = serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
            .states.find { it.state.data.id == contractId }?.state?.data
            ?: throw IllegalArgumentException("Infrastructure contract with ID $contractId not found")

        require(contractState.isActive()) { "Contract must be active to execute" }

        progressTracker.currentStep = "Executing contract"
        
        val executedState = contractState.copy(
            lastExecutionTime = Instant.now()
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(InfrastructureContract.Commands.Execute(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
                .states.find { it.state.data.id == contractId }!!)
            .addOutputState(executedState, InfrastructureContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to settle an infrastructure contract
 */
@InitiatingFlow
@StartableByRPC
class SettleInfrastructureContractFlow(
    private val contractId: String,
    private val settlementData: SettlementData,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving infrastructure contract state",
        "Settling contract",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving infrastructure contract state"
        
        val contractState = serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
            .states.find { it.state.data.id == contractId }?.state?.data
            ?: throw IllegalArgumentException("Infrastructure contract with ID $contractId not found")

        require(contractState.isActive()) { "Contract must be active to settle" }

        progressTracker.currentStep = "Settling contract"
        
        val settledState = contractState.copy(
            lastSettlementTime = Instant.now()
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(InfrastructureContract.Commands.Settle(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
                .states.find { it.state.data.id == contractId }!!)
            .addOutputState(settledState, InfrastructureContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to terminate an infrastructure contract
 */
@InitiatingFlow
@StartableByRPC
class TerminateInfrastructureContractFlow(
    private val contractId: String,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving infrastructure contract state",
        "Terminating contract",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving infrastructure contract state"
        
        val contractState = serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
            .states.find { it.state.data.id == contractId }?.state?.data
            ?: throw IllegalArgumentException("Infrastructure contract with ID $contractId not found")

        require(contractState.status == ContractStatus.ACTIVE) { "Contract must be active to terminate" }

        progressTracker.currentStep = "Terminating contract"
        
        val terminatedState = contractState.copy(
            status = ContractStatus.TERMINATED,
            terminationTime = Instant.now()
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(InfrastructureContract.Commands.Terminate(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
                .states.find { it.state.data.id == contractId }!!)
            .addOutputState(terminatedState, InfrastructureContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to query active infrastructure contracts
 */
@StartableByRPC
class QueryActiveInfrastructureContractsFlow : FlowLogic<List<InfrastructureContractState>>() {

    @Suspendable
    override fun call(): List<InfrastructureContractState> {
        return serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
            .states
            .map { it.state.data }
            .filter { it.status == ContractStatus.ACTIVE }
    }
}

/**
 * Flow to query infrastructure contracts by type
 */
@StartableByRPC
class QueryInfrastructureContractsByTypeFlow(
    private val contractType: ContractType
) : FlowLogic<List<InfrastructureContractState>>() {

    @Suspendable
    override fun call(): List<InfrastructureContractState> {
        return serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
            .states
            .map { it.state.data }
            .filter { it.contractType == contractType }
    }
}

/**
 * Flow to calculate infrastructure costs
 */
@StartableByRPC
class CalculateInfrastructureCostsFlow(
    private val contractId: String,
    private val usageData: InfrastructureUsageData
) : FlowLogic<InfrastructureCostResult>() {

    @Suspendable
    override fun call(): InfrastructureCostResult {
        val contractState = serviceHub.vaultService.queryBy(InfrastructureContractState::class.java)
            .states.find { it.state.data.id == contractId }?.state?.data
            ?: throw IllegalArgumentException("Infrastructure contract with ID $contractId not found")

        val baseCost = contractState.terms.cost
        val usageCost = calculateUsageCost(contractState, usageData)
        val totalCost = baseCost + usageCost

        return InfrastructureCostResult(
            contractId = contractId,
            baseCost = baseCost,
            usageCost = usageCost,
            totalCost = totalCost,
            currency = contractState.terms.costUnit,
            calculationDate = Instant.now()
        )
    }

    private fun calculateUsageCost(contract: InfrastructureContractState, usage: InfrastructureUsageData): BigDecimal {
        return when (contract.contractType) {
            ContractType.TOWER_SHARING -> BigDecimal(usage.towerUsage * 0.1) // Example rate
            ContractType.FIBER_ACCESS -> BigDecimal(usage.fiberUsage * 0.05) // Example rate
            ContractType.SPECTRUM_SHARING -> BigDecimal(usage.spectrumUsage * 0.2) // Example rate
            ContractType.BACKHAUL_SHARING -> BigDecimal(usage.backhaulUsage * 0.15) // Example rate
            ContractType.CO_LOCATION -> BigDecimal(usage.coLocationUsage * 0.08) // Example rate
        }
    }
}

/**
 * Infrastructure Execution Data
 */
data class InfrastructureExecutionData(
    val executionType: String,
    val resourcesUsed: Map<String, Double>,
    val performanceMetrics: Map<String, Double>,
    val timestamp: Instant
)

/**
 * Settlement Data
 */
data class SettlementData(
    val settlementAmount: BigDecimal,
    val currency: String,
    val paymentMethod: String,
    val settlementDate: Instant
)

/**
 * Infrastructure Usage Data
 */
data class InfrastructureUsageData(
    val towerUsage: Double,
    val fiberUsage: Double,
    val spectrumUsage: Double,
    val backhaulUsage: Double,
    val coLocationUsage: Double,
    val timePeriod: String
)

/**
 * Infrastructure Cost Result
 */
data class InfrastructureCostResult(
    val contractId: String,
    val baseCost: BigDecimal,
    val usageCost: BigDecimal,
    val totalCost: BigDecimal,
    val currency: String,
    val calculationDate: Instant
)
