# Test Humn Faucet

This project is a high-performance, anonymous ERC-20 token faucet. It uses a Zero-Knowledge (ZK) flow with an Oblivious Pseudo-Random Function (OPRF) to allow users to claim tokens once per identity (e.g., an X account) without linking their social identity to their wallet address.

The entire application is fully containerized with Docker for easy setup and deployment.

## 🏛️ Architecture & User Flow

The project is composed of four main services, orchestrated by Docker Compose. The user flow is designed to be anonymous from end-to-end.

1.  **Frontend (Next.js)**: The user lands on the website.
2.  **Wallet Connection**: The user connects their EVM wallet (e.g., MetaMask) using `wagmi`.
3.  **Identity Verification (Mocked)**: The user enters their X handle. In this demo, we trust this input.
4.  **OPRF Signing (Client-Side)**:
      * The frontend uses `@holonym-foundation/mishtiwasm` to call the **Signer Service**.
      * It sends a *masked* version of the user's ID.
      * The **Signer Service** (OPRF) returns a unique, un-linkable "eligibility token."
5.  **ZK Generation (Client-Side)**:
      * The frontend locally computes a **Nullifier** by hashing (`SHA-256`) the eligibility token with a domain separator. This nullifier proves the user is unique.
6.  **Claim Submission**:
      * The frontend sends *only* the `nullifier` and the `walletAddress` to the **Backend (Rust)**.
      * **Crucially, the backend never sees the user's X handle or the eligibility token.**
7.  **Backend Verification (Rust)**:
      * The **Backend** (Axum) receives the request.
      * It attempts to insert the `nullifier` into the **PostgreSQL Database**.
      * If the `nullifier` already exists (violating the `UNIQUE` constraint), it returns a "Already Claimed" error.
8.  **Token Transfer**:
      * If the nullifier is new, the backend uses `alloy-rs` (via a WSS client) to send `TestHumnToken` (ERC-20) from the faucet's hot wallet to the user's `walletAddress`.
      * The backend then stores the resulting `tx_hash` in the database alongside the nullifier.
9.  **Success**: The backend returns the `tx_hash` to the frontend, which shows the user a success message.

-----

## 🚀 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) (React) | User interface, wallet connection, and client-side crypto. |
| **Wallet Lib** | [Wagmi](https://wagmi.sh/) | React Hooks for Ethereum wallet interaction. |
| **Backend** | [Rust](https://www.rust-lang.org/) / [Axum](https://github.com/tokio-rs/axum) | High-performance API for claim verification. |
| **EVM Lib** | [Alloy-rs](https://github.com/alloy-rs) | Modern Rust library for EVM interaction (WSS client). |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Stores nullifiers to prevent double-claims. |
| **DB ORM** | [SQLx](https://github.com/launchbadge/sqlx) | Asynchronous SQL toolkit for Rust. |
| **Signer** | [Mishti Network](https://www.google.com/search?q=https://www.holonym.id/mishti) | OPRF signer service for anonymous eligibility. |
| **Orchestration** | [Docker Compose](https://docs.docker.com/compose/) | Manages all services, networks, and volumes. |

-----

## 📋 Prerequisites

Before you begin, you will need the following:

  * [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
  * A testnet RPC URL (WSS) (e.g., from [Infura](https://www.infura.io/) or [Alchemy](https://www.alchemy.com/))
  * A private key for your faucet wallet, funded with testnet ETH and your `TestHumnToken`.
  * A private key for the Mishti Signer (requires whitelisting by Holonym).

-----

## ⚡ Getting Started

### 1\. Deploy Your ERC-20 Token

Before starting, you must deploy your `TestHumnToken` (or any ERC-20) to a testnet (e.g., Sepolia).

  * You can use the `TestHumnToken.sol` contract provided.
  * After deploying, **copy the contract address**.

### 2\. Configure Environment

Create a `.env` file in the root of the project. You can copy the example:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in all the required variables.

### `/.env`

```ini
# PostgreSQL Settings
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=faucet_db

# Backend Faucet Settings (Hot Wallet)
# PRIVATE KEY FOR THE FAUCET WALLET
FAUCET_PRIVATE_KEY=0x...
# YOUR WSS RPC URL (e.g., wss://sepolia.infura.io/ws/v3/...)
RPC_URL=wss://...
# THE ADDRESS OF YOUR DEPLOYED TestHumnToken
TOKEN_CONTRACT_ADDRESS=0x...

# Mishti Signer Service
SIGNER_ENV=prod
# Holonym-provided RPC URL
MISHTI_RPC_URL=<MISHTI_RELAY_NODE_MAINNET_ALPHA_URL>
# YOUR WHITELISTED SIGNER PRIVATE KEY
MISHTI_SIGNER_PRIVATE_KEY=0x...
# Port for the signer (must not conflict with 3000 or 3030)
SIGNER_PORT=3001
# e.g., OPRFBabyJubJub
ALLOWED_METHODS=<ADD_YOUR_ALLOWED_METHODS_HERE>
RATE_LIMIT_ENABLED=true
RATE_LIMIT_NUM_REQUESTS=100
RATE_LIMIT_TIME_INTERVAL=86400
```

### 3\. Build and Run the Application

With your `.env` file configured, you can build and run all services with a single command:

```bash
# Build the images (only needed the first time or after code changes)
docker-compose build

# Start all services in detached mode
docker-compose up -d
```

### 4\. Access Your Faucet

  * **Frontend**: [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
  * **Backend API**: [http://localhost:3030](https://www.google.com/search?q=http://localhost:3030)
  * **Signer API**: [http://localhost:3001](https://www.google.com/search?q=http://localhost:3001)

-----

## 📁 Project Structure

```
/humn-faucet
├── backend/
│   ├── src/
│   │   └── main.rs       # Rust (Axum) server logic
│   ├── migrations/       # SQLx database migrations
│   ├── Cargo.toml        # Rust dependencies
│   ├── Dockerfile        # Multi-stage Docker build for backend
│   └── .dockerignore
├── frontend/
│   ├── app/              # Next.js app
│   ├── components/       # React components
│   ├── package.json      # Node.js dependencies
│   ├── Dockerfile        # Multi-stage Docker build for frontend
│   └── .dockerignore
├── .env                  # (Git-ignored) All secrets and config
├── .env.example          # Template for environment variables
└── docker-compose.yml    # Main orchestration file for all services
```

-----

## 🛠️ Docker Compose Services

  * `db`: The PostgreSQL 16 service. Data is persisted in a Docker volume named `postgres_data`.
  * `backend`: The Rust API. It automatically runs database migrations on startup.
  * `frontend`: The Next.js application.
  * `signer`: The pre-built `mishtinetwork/signer` image.