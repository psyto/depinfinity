package com.ntt.docomo.depinfinity.config

import net.corda.core.identity.Party
import net.corda.core.identity.CordaX500Name
import net.corda.core.utilities.NetworkHostAndPort
import java.time.Duration

/**
 * Corda Network Configuration for DePINfinity B2B Integration
 * 
 * This configuration defines the Corda network setup for NTT DOCOMO's
 * B2B mobile infrastructure network.
 */
object CordaNetworkConfig {

    /**
     * Network Configuration
     */
    object Network {
        const val NETWORK_NAME = "DePINfinity B2B Network"
        const val NETWORK_VERSION = "1.0"
        const val PROTOCOL_VERSION = 4
        
        val NOTARY_NODE = NetworkHostAndPort("notary.ntt-docomo.com", 10002)
        val DOCOMO_NODE = NetworkHostAndPort("docomo.ntt-docomo.com", 10003)
        val PARTNER_NODE = NetworkHostAndPort("partner.ntt-docomo.com", 10004)
        
        val NETWORK_MAP_SERVICE = NetworkHostAndPort("networkmap.ntt-docomo.com", 10001)
    }

    /**
     * Node Configuration
     */
    object Nodes {
        val DOCOMO_NODE_NAME = CordaX500Name(
            organisation = "NTT DOCOMO",
            organisationalUnit = "DePINfinity",
            locality = "Tokyo",
            state = "Tokyo",
            country = "JP"
        )
        
        val PARTNER_NODE_NAME = CordaX500Name(
            organisation = "Partner Carrier",
            organisationalUnit = "B2B Integration",
            locality = "Tokyo",
            state = "Tokyo",
            country = "JP"
        )
        
        val NOTARY_NODE_NAME = CordaX500Name(
            organisation = "NTT DOCOMO",
            organisationalUnit = "Notary Service",
            locality = "Tokyo",
            state = "Tokyo",
            country = "JP"
        )
    }

    /**
     * Security Configuration
     */
    object Security {
        const val SSL_ENABLED = true
        const val SSL_CERT_PATH = "/opt/corda/certificates/"
        const val SSL_KEYSTORE_PATH = "/opt/corda/keystore.jks"
        const val SSL_TRUSTSTORE_PATH = "/opt/corda/truststore.jks"
        
        const val AUTHENTICATION_ENABLED = true
        const val AUTHENTICATION_TOKEN = "depinfinity-auth-token"
        
        const val ENCRYPTION_ENABLED = true
        const val ENCRYPTION_ALGORITHM = "AES-256-GCM"
    }

    /**
     * Database Configuration
     */
    object Database {
        const val DATABASE_TYPE = "postgresql"
        const val DATABASE_HOST = "db.ntt-docomo.com"
        const val DATABASE_PORT = 5432
        const val DATABASE_NAME = "depinfinity_corda"
        const val DATABASE_USER = "corda_user"
        const val DATABASE_PASSWORD = "secure_password"
        
        const val CONNECTION_POOL_SIZE = 20
        const val CONNECTION_TIMEOUT = Duration.ofSeconds(30)
        const val IDLE_TIMEOUT = Duration.ofMinutes(10)
    }

    /**
     * API Configuration
     */
    object API {
        const val API_HOST = "api.ntt-docomo.com"
        const val API_PORT = 8080
        const val API_VERSION = "v1"
        const val API_BASE_PATH = "/api/v1"
        
        const val RATE_LIMIT_ENABLED = true
        const val RATE_LIMIT_REQUESTS_PER_MINUTE = 1000
        const val RATE_LIMIT_BURST_SIZE = 100
        
        const val CORS_ENABLED = true
        val CORS_ALLOWED_ORIGINS = listOf(
            "https://solana.ntt-docomo.com",
            "https://mobile.ntt-docomo.com",
            "https://dashboard.ntt-docomo.com"
        )
    }

    /**
     * Monitoring Configuration
     */
    object Monitoring {
        const val METRICS_ENABLED = true
        const val METRICS_PORT = 8081
        const val HEALTH_CHECK_ENABLED = true
        const val HEALTH_CHECK_PORT = 8082
        
        const val LOGGING_LEVEL = "INFO"
        const val LOG_FILE_PATH = "/opt/corda/logs/depinfinity.log"
        const val LOG_ROTATION_SIZE = "100MB"
        const val LOG_RETENTION_DAYS = 30
        
        const val ALERTING_ENABLED = true
        const val ALERT_EMAIL = "alerts@ntt-docomo.com"
        const val ALERT_SLACK_WEBHOOK = "https://hooks.slack.com/services/..."
    }

    /**
     * Business Logic Configuration
     */
    object BusinessLogic {
        const val NETWORK_DATA_RETENTION_DAYS = 365
        const val AGREEMENT_RETENTION_DAYS = 2555 // 7 years
        const val CONTRACT_RETENTION_DAYS = 2555 // 7 years
        
        const val DATA_ANONYMIZATION_ENABLED = true
        const val DATA_ANONYMIZATION_PRECISION = 2 // Decimal places for coordinates
        
        const val AUTOMATED_MIGRATION_ENABLED = true
        const val MIGRATION_INTERVAL_HOURS = 24
        const val MIGRATION_BATCH_SIZE = 1000
        
        const val REVENUE_SHARING_ENABLED = true
        const val DEFAULT_REVENUE_SHARING_PERCENTAGE = 10.0
        const val MINIMUM_REVENUE_SHARING_PERCENTAGE = 5.0
        const val MAXIMUM_REVENUE_SHARING_PERCENTAGE = 50.0
    }

    /**
     * Integration Configuration
     */
    object Integration {
        const val SOLANA_INTEGRATION_ENABLED = true
        const val SOLANA_RPC_URL = "https://api.devnet.solana.com"
        const val SOLANA_PROGRAM_ID = "DePINfinity111111111111111111111111111111111"
        const val SOLANA_WALLET_PATH = "/opt/corda/wallets/solana_wallet.json"
        
        const val CORDABRIDGE_ENABLED = true
        const val CORDABRIDGE_ENDPOINT = "https://corda.ntt-docomo.com/api"
        const val CORDABRIDGE_API_KEY = "corda-api-key"
        
        const val MOBILE_APP_INTEGRATION_ENABLED = true
        const val MOBILE_APP_API_KEY = "mobile-app-api-key"
        const val MOBILE_APP_WEBHOOK_URL = "https://mobile.ntt-docomo.com/webhook"
    }

    /**
     * Performance Configuration
     */
    object Performance {
        const val MAX_TRANSACTION_SIZE = 1024 * 1024 // 1MB
        const val MAX_STATE_SIZE = 1024 * 1024 // 1MB
        const val MAX_FLOW_DURATION = Duration.ofMinutes(10)
        
        const val CACHE_ENABLED = true
        const val CACHE_SIZE = 10000
        const val CACHE_TTL = Duration.ofMinutes(30)
        
        const val BATCH_PROCESSING_ENABLED = true
        const val BATCH_SIZE = 100
        const val BATCH_TIMEOUT = Duration.ofSeconds(30)
    }

    /**
     * Compliance Configuration
     */
    object Compliance {
        const val GDPR_COMPLIANCE_ENABLED = true
        const val DATA_PROCESSING_CONSENT_REQUIRED = true
        const val DATA_RETENTION_POLICY_ENABLED = true
        
        const val AUDIT_LOGGING_ENABLED = true
        const val AUDIT_LOG_RETENTION_DAYS = 2555 // 7 years
        
        const val PRIVACY_PRESERVING_ENABLED = true
        const val DIFFERENTIAL_PRIVACY_ENABLED = true
        const val NOISE_SCALE = 1.0
    }

    /**
     * Deployment Configuration
     */
    object Deployment {
        const val ENVIRONMENT = "production"
        const val CLUSTER_MODE = true
        const val LOAD_BALANCER_ENABLED = true
        
        const val BACKUP_ENABLED = true
        const val BACKUP_INTERVAL_HOURS = 6
        const val BACKUP_RETENTION_DAYS = 30
        
        const val DISASTER_RECOVERY_ENABLED = true
        const val DR_SITE_URL = "https://dr.ntt-docomo.com"
        const val DR_SYNC_INTERVAL_HOURS = 1
    }
}
