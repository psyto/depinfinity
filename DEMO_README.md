# DePINfinity Demo - Hackathon Edition

## 🎯 Demo Overview

The DePINfinity hackathon demo provides a complete demonstration of the mobile app by mocking the Solana program and Corda network, showcasing the full hybrid mobile infrastructure solution.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install mock services
cd mock-solana && npm install
cd ../mock-corda && npm install
cd ../demo-simulator && npm install
```

### 2. Launch Mobile App

```bash
cd mobile-app
npm install
npx react-native run-android
# or
npx react-native run-ios
```

### 3. Run Demo

1. Launch the app
2. Tap "Start Demo" button
3. Automatic device registration, data collection, and B2B transactions will be simulated

## 📱 Demo Features

### User Participation Features

-   **Device Registration**: Register smartphones, routers, and hotspots
-   **Data Collection**: Automatic network quality data collection
-   **Token Rewards**: Quality-based reward calculation
-   **Real-time Statistics**: Device and network statistics display

### B2B Transaction Features

-   **Data Migration**: Solana to Corda data migration
-   **Roaming Agreements**: Inter-carrier roaming contracts
-   **Infrastructure Contracts**: Physical infrastructure sharing contracts
-   **Automated Settlement**: Contract-based automated payments

## 🎬 Demo Scenarios

### Scenario 1: Initial Setup (1 minute)

-   Register 3 devices
-   Different device types (smartphone, router, hotspot)
-   Tokyo area registration

### Scenario 2: Data Collection (2 minutes)

-   Network quality data submission
-   Real-time reward calculation
-   Quality-based reward variations

### Scenario 3: B2B Integration (3 minutes)

-   Roaming agreement with SoftBank Mobile
-   Roaming agreement with KDDI au
-   Infrastructure sharing contract creation

## 🔧 Technical Specifications

### Mock Solana Program

-   Device registration and management
-   Network data processing
-   Token reward calculation
-   Real-time events

### Mock Corda Network

-   B2B contract management
-   Data migration processing
-   Revenue calculation and distribution
-   Contract execution automation

### Demo Simulator

-   Realistic data generation
-   Automated scenario execution
-   Event-driven architecture

## 📊 Demo Data

### Network Quality Data

```typescript
{
  signalStrength: -65 to -45 dBm,
  latency: 20-100ms,
  throughput: 0.5-2 Mbps,
  availability: 80-100%
}
```

### Reward Calculation

```typescript
baseReward = 1000 tokens
qualityMultiplier = signal * latency * throughput * availability
uptimeBonus = 1.0 + (uptime / 1000) * 0.5
totalReward = baseReward * qualityMultiplier * uptimeBonus
```

## 🎨 UI/UX Features

### Main Screen

-   Connection status display
-   Demo controls (start/stop)
-   Device registration button
-   Data collection toggle

### Statistics Display

-   Device statistics (uptime, rewards, status)
-   B2B statistics (data points, contracts, revenue)
-   Network quality data
-   Real-time updates

## 🚀 Hackathon Preparation

### Presentation Materials

1. **Demo Videos**: Record each scenario
2. **Slides**: Technical architecture explanation
3. **Live Demo**: Real-time demonstration

### Technical Explanation

1. **Hybrid Model**: Public (Solana) + Private (Corda)
2. **Data Flow**: User → Solana → Corda → B2B
3. **Token Economy**: Incentive design and reward calculation
4. **Privacy**: Anonymization and data protection

## 🔧 Troubleshooting

### Common Issues

1. **Connection Error**: Check mock service initialization
2. **No Data Display**: Verify device registration
3. **Demo Stops**: Check timeout settings

### Debugging

```bash
# Check logs
npx react-native log-android
npx react-native log-ios

# Check mock service status
console.log(mockSolanaProgram.getNetworkStats());
console.log(mockCordaNetwork.getNetworkStats());
```

## 📈 Future Development

### Full Implementation

1. **Solana Program**: Anchor framework implementation
2. **Corda Network**: Real Corda node implementation
3. **Mobile App**: Full React Native application

### Business Expansion

1. **Partnerships**: Carrier collaborations
2. **Technical Integration**: Existing infrastructure integration
3. **Scaling**: Global expansion

## 🏆 Hackathon Success Points

1. **Technical Demo**: Working prototype
2. **Business Value**: Clear revenue model
3. **Innovation**: New approach presentation
4. **Practicality**: Real deployment feasibility

---

**DePINfinity Team** - Hackathon Demo
