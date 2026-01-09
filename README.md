# nTZS

nTZS is an ERC-20 stablecoin-style token issued against approved fiat deposits, built for Tanzania's mobile money ecosystem.

## 🌟 Overview

- **ERC-20 token** on Base Sepolia (testnet) - migrating to Base mainnet
- **Fiat-backed**: 1 nTZS = 1 TZS (Tanzanian Shilling)
- **Mobile money integration**: M-Pesa, Tigo Pesa, Airtel Money, Halotel
- **Compliance features**: KYC verification, transaction monitoring
- **Open source**: Seeking contributors and auditors

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User App      │    │   Backstage     │    │   ZenoPay API   │
│   (Next.js)     │    │   (Admin Panel) │    │   (Mobile Money)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database (Neon)                        │
│  - Users, KYC, Deposits, Wallets, Mint Transactions        │
└─────────────────────────────────────────────────────────────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│   Cron Jobs     │    │   Mint Worker   │
│   - Poll PSP    │    │   - Mint nTZS   │
│   - Process     │    │   - Update DB   │
└─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Base Blockchain (nTZS Contract)               │
│  - ERC-20 with pause, freeze, blacklist, wipe features     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Repository Structure

- `apps/web`: Next.js web app (user portal + `/backstage` super-admin)
- `apps/worker`: Background worker for automated minting
- `packages/contracts`: Hardhat workspace for nTZS ERC-20 contract
- `packages/db`: Drizzle schema + database client

## 🌐 Networks & Deployments

### Testnet (Current)
- **Base Sepolia** (chainId: `84532`)
- nTZS Contract: `0x6A9525A5C82F92E10741Fcdcb16DbE9111630077`
- Safe Admin: `0x943Ec4ECA8195F54Fb5369B168534F9462Ce4faa`

### Mainnet (Planned)
- **Base** (chainId: `8453`)
- Coming soon after audit and testing

## 🚀 Quick Start

1. **Clone & Install**
```bash
git clone https://github.com/mxsafiri/n-tzs.git
cd n-tzs
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local with your keys (never commit)
```

Required variables:
```env
DATABASE_URL=postgresql://...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NTZS_CONTRACT_ADDRESS_BASE_SEPOLIA=0x6A9525A5C82F92E10741Fcdcb16DbE9111630077
NTZS_SAFE_ADMIN=0x943Ec4ECA8195F54Fb5369B168534F9462Ce4faa
MINTER_PRIVATE_KEY=0x...
ZENOPAY_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run Development**
```bash
# Web app (includes user portal + admin)
npm run dev:web

# Mint worker (in separate terminal)
npm run dev:worker
```

4. **Access Applications**
- User Portal: `http://localhost:3000/app`
- Admin Portal: `http://localhost:3000/backstage`

## 💰 Deposit & Mint Flow

1. **User submits deposit** with amount + phone number
2. **ZenoPay processes** mobile money payment (M-Pesa, etc.)
3. **Webhook confirms** payment → status: `mint_pending`
4. **Worker mints** nTZS to user's wallet
5. **Status updated** to `minted` ✅

## 🔧 Key Features

### Token Contract
- **ERC-20 standard** with EIP-2612 (permit)
- **Pausable**: Emergency pause all transfers
- **Freeze**: Freeze individual accounts (can receive, can't send)
- **Blacklist**: Block transfers to/from addresses
- **Wipe**: Burn blacklisted balances
- **Role-based**: MINTER, PAUSER, FREEZER, ADMIN roles

### Web Application
- **KYC verification** with document upload
- **Multi-wallet support** (Base, with more chains planned)
- **Real-time balance** updates from blockchain
- **Transaction history** and activity tracking
- **Responsive design** for mobile-first Tanzania market

### Admin Portal
- **User management** and role assignment
- **Deposit approval** workflow
- **Mint queue** monitoring
- **Safe integration** for large transactions (≥9,000 TZS)
- **Audit logging** for compliance

## 🤝 Contributing

We welcome contributions! Areas where we need help:

### 🔍 Smart Contract Audit
- Security review of nTZS contract
- Gas optimization suggestions
- Compliance with ERC-20 standards

### 🛠️ Development
- **Frontend**: React/Next.js improvements
- **Smart Contracts**: Additional features, testing
- **Backend**: API optimizations, error handling
- **DevOps**: Monitoring, CI/CD improvements

### 📋 Specific Areas
1. **Multi-chain support** (Ethereum, Polygon, etc.)
2. **Advanced KYC** with biometric verification
3. **DeFi integrations** (DEXes, lending protocols)
4. **Mobile app** (React Native/Flutter)
5. **Compliance tools** (AML screening, reporting)

### 🚀 Getting Started Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Submit a Pull Request with description

**Please include:**
- Clear description of changes
- Tests for new functionality
- Security considerations for contract changes

## 🔒 Security

- **All contracts** will be professionally audited before mainnet
- **Bug bounty** program planned post-launch
- **Multi-sig controls** for critical operations
- **Regular security** updates and patches

## 📞 Contact

- **GitHub Issues**: For bugs and feature requests
- **Discord**: [Coming soon]
- **Twitter**: [@nTZS_token](https://twitter.com/nTZS_token)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**⚠️ Important**: This is testnet software. Do not use with real funds until mainnet audit is complete.

---

*Building the future of digital currency in Tanzania* 🇹🇿
