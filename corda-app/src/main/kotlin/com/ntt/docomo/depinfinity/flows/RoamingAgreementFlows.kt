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
import java.time.Instant

/**
 * Flow to create a roaming agreement
 */
@InitiatingFlow
@StartableByRPC
class CreateRoamingAgreementFlow(
    private val partnerId: String,
    private val region: String,
    private val terms: AgreementTerms,
    private val networkData: NetworkQualityData,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Creating roaming agreement state",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Creating roaming agreement state"
        
        val roamingAgreementState = RoamingAgreementState(
            id = UniqueIdentifier().toString(),
            partnerId = partnerId,
            region = region,
            terms = terms,
            networkData = networkData,
            status = AgreementStatus.PENDING,
            creationTime = Instant.now(),
            lastExecutionTime = Instant.now(),
            terminationTime = null,
            participants = participants
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(RoamingAgreementContract.Commands.Create(), participants.map { it.owningKey })
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addOutputState(roamingAgreementState, RoamingAgreementContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to activate a roaming agreement
 */
@InitiatingFlow
@StartableByRPC
class ActivateRoamingAgreementFlow(
    private val agreementId: String,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving roaming agreement state",
        "Activating agreement",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving roaming agreement state"
        
        val agreementState = serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
            .states.find { it.state.data.id == agreementId }?.state?.data
            ?: throw IllegalArgumentException("Roaming agreement with ID $agreementId not found")

        progressTracker.currentStep = "Activating agreement"
        
        val activatedState = agreementState.copy(
            status = AgreementStatus.ACTIVE,
            lastExecutionTime = Instant.now()
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(RoamingAgreementContract.Commands.Update(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
                .states.find { it.state.data.id == agreementId }!!)
            .addOutputState(activatedState, RoamingAgreementContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to execute a roaming agreement
 */
@InitiatingFlow
@StartableByRPC
class ExecuteRoamingAgreementFlow(
    private val agreementId: String,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving roaming agreement state",
        "Executing agreement",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving roaming agreement state"
        
        val agreementState = serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
            .states.find { it.state.data.id == agreementId }?.state?.data
            ?: throw IllegalArgumentException("Roaming agreement with ID $agreementId not found")

        require(agreementState.isActive()) { "Agreement must be active to execute" }

        progressTracker.currentStep = "Executing agreement"
        
        val executedState = agreementState.copy(
            lastExecutionTime = Instant.now()
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(RoamingAgreementContract.Commands.Execute(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
                .states.find { it.state.data.id == agreementId }!!)
            .addOutputState(executedState, RoamingAgreementContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to terminate a roaming agreement
 */
@InitiatingFlow
@StartableByRPC
class TerminateRoamingAgreementFlow(
    private val agreementId: String,
    private val participants: List<Party>
) : FlowLogic<SignedTransaction>() {

    override val progressTracker = ProgressTracker(
        "Retrieving roaming agreement state",
        "Terminating agreement",
        "Building transaction",
        "Signing transaction",
        "Finalizing transaction"
    )

    @Suspendable
    override fun call(): SignedTransaction {
        progressTracker.currentStep = "Retrieving roaming agreement state"
        
        val agreementState = serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
            .states.find { it.state.data.id == agreementId }?.state?.data
            ?: throw IllegalArgumentException("Roaming agreement with ID $agreementId not found")

        require(agreementState.status == AgreementStatus.ACTIVE) { "Agreement must be active to terminate" }

        progressTracker.currentStep = "Terminating agreement"
        
        val terminatedState = agreementState.copy(
            status = AgreementStatus.TERMINATED,
            terminationTime = Instant.now()
        )

        progressTracker.currentStep = "Building transaction"
        
        val command = Command(RoamingAgreementContract.Commands.Terminate(), participants.map { it.owningKey })
        
        val txBuilder = TransactionBuilder(notary = serviceHub.networkMapCache.notaryIdentities.first())
            .addInputState(serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
                .states.find { it.state.data.id == agreementId }!!)
            .addOutputState(terminatedState, RoamingAgreementContract.ID)
            .addCommand(command)

        progressTracker.currentStep = "Signing transaction"
        
        val signedTx = serviceHub.signInitialTransaction(txBuilder)

        progressTracker.currentStep = "Finalizing transaction"
        
        return subFlow(FinalityFlow(signedTx, participants))
    }
}

/**
 * Flow to query active roaming agreements
 */
@StartableByRPC
class QueryActiveRoamingAgreementsFlow : FlowLogic<List<RoamingAgreementState>>() {

    @Suspendable
    override fun call(): List<RoamingAgreementState> {
        return serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
            .states
            .map { it.state.data }
            .filter { it.status == AgreementStatus.ACTIVE }
    }
}

/**
 * Flow to query roaming agreements by partner
 */
@StartableByRPC
class QueryRoamingAgreementsByPartnerFlow(
    private val partnerId: String
) : FlowLogic<List<RoamingAgreementState>>() {

    @Suspendable
    override fun call(): List<RoamingAgreementState> {
        return serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
            .states
            .map { it.state.data }
            .filter { it.partnerId == partnerId }
    }
}

/**
 * Flow to calculate revenue sharing for a roaming agreement
 */
@StartableByRPC
class CalculateRevenueSharingFlow(
    private val agreementId: String,
    private val usageData: UsageData
) : FlowLogic<RevenueSharingResult>() {

    @Suspendable
    override fun call(): RevenueSharingResult {
        val agreementState = serviceHub.vaultService.queryBy(RoamingAgreementState::class.java)
            .states.find { it.state.data.id == agreementId }?.state?.data
            ?: throw IllegalArgumentException("Roaming agreement with ID $agreementId not found")

        val revenueSharingPercentage = agreementState.terms.revenueSharing
        val totalRevenue = usageData.dataUsage * usageData.costPerMB
        val sharedRevenue = totalRevenue * (revenueSharingPercentage / 100.0)

        return RevenueSharingResult(
            agreementId = agreementId,
            totalRevenue = totalRevenue,
            sharedRevenue = sharedRevenue,
            revenueSharingPercentage = revenueSharingPercentage,
            calculationDate = Instant.now()
        )
    }
}

/**
 * Usage Data for Revenue Calculation
 */
data class UsageData(
    val dataUsage: Long, // MB
    val costPerMB: Double, // Currency per MB
    val timePeriod: String
)

/**
 * Revenue Sharing Result
 */
data class RevenueSharingResult(
    val agreementId: String,
    val totalRevenue: Double,
    val sharedRevenue: Double,
    val revenueSharingPercentage: Double,
    val calculationDate: Instant
)
