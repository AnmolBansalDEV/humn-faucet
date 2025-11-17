use alloy::contract::ContractInstance;
use alloy::network::EthereumWallet;
use alloy::primitives::{Address, U256};
use alloy::providers::fillers::WalletFiller;
use alloy::providers::WsConnect;
use alloy::providers::{
    fillers::{BlobGasFiller, ChainIdFiller, FillProvider, GasFiller, JoinFill, NonceFiller},
    Identity, Provider, ProviderBuilder, RootProvider,
};
use alloy::signers::local::PrivateKeySigner;
use alloy::sol;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::net::SocketAddr;
use std::time::Duration;
use std::{env, sync::Arc};
use tokio::time::timeout;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{error, info, level_filters::LevelFilter};

// Define the ERC20 contract interface
sol! {
    #[sol(rpc)]
    contract TestHumnToken {
        function mint(address to, uint256 amount) public;
    }
}

type WsProvider = FillProvider<
    JoinFill<
        JoinFill<
            Identity,
            JoinFill<GasFiller, JoinFill<BlobGasFiller, JoinFill<NonceFiller, ChainIdFiller>>>,
        >,
        WalletFiller<EthereumWallet>,
    >,
    RootProvider,
>;

// --- 1. Application State ---
#[derive(Clone)]
struct AppState {
    pool: PgPool,
    provider: Arc<WsProvider>,
    token_contract: Address,
}

// --- 2. API Request/Response Models ---
#[derive(Deserialize)]
struct ClaimRequest {
    #[serde(rename = "walletAddress")]
    wallet_address: String,
    nullifier: String,
}

#[derive(Serialize)]
struct ClaimResponse {
    #[serde(rename = "txHash")]
    tx_hash: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    message: String,
}

// --- 3. Custom Error Type ---
enum AppError {
    DatabaseError(sqlx::Error),
    AlreadyClaimed,
    TransactionError(String),
    InvalidAddress(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::AlreadyClaimed => (
                StatusCode::CONFLICT,
                "This identity has already claimed.".to_string(),
            ),
            AppError::TransactionError(e) => {
                error!("Transaction error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Transaction failed: {}", e),
                )
            }
            AppError::InvalidAddress(e) => (
                StatusCode::BAD_REQUEST,
                format!("Invalid wallet address: {}", e),
            ),
            AppError::DatabaseError(e) => {
                error!("Database error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "An internal error occurred.".to_string(),
                )
            }
        };

        let body = Json(ErrorResponse { message });
        (status, body).into_response()
    }
}

// --- 4. Main Application Entrypoint ---
#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env()
                .expect("Failed to parse RUST_LOG environment variable"),
        )
        .init();

    // Load .env file
    dotenv::dotenv().ok();

    // Get environment variables
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let rpc_url = env::var("RPC_URL").expect("RPC_URL must be set");
    let private_key = env::var("FAUCET_PRIVATE_KEY").expect("PRIVATE_KEY must be set");
    let token_contract_address =
        env::var("TOKEN_CONTRACT_ADDRESS").expect("TOKEN_CONTRACT_ADDRESS must be set");

    // Parse token contract address
    let token_contract: Address = token_contract_address
        .parse()
        .expect("Invalid TOKEN_CONTRACT_ADDRESS");

    // Create database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .expect("Failed to create pool.");

    // Run database migrations
    info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run database migrations");
    info!("Migrations complete.");

    // Setup blockchain provider and wallet
    let signer: PrivateKeySigner = private_key.parse().expect("Failed to parse private key");
    let wallet = EthereumWallet::from(signer);

    let ws = WsConnect::new(&rpc_url);
    let provider = Arc::new(
        ProviderBuilder::new()
            .wallet(wallet)
            .connect_ws(ws)
            .await
            .expect("Failed to connect to RPC"),
    );

    info!("Connected to blockchain at {}", rpc_url);
    info!("Token contract: {}", token_contract);

    // Create our application state
    let app_state = AppState {
        pool,
        provider: provider,
        token_contract,
    };

    // Define API routes
    let app = Router::new()
        .route("/api/claim", post(claim_handler))
        .with_state(app_state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any) // Be more restrictive in production
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http());

    // Run the server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3030));
    info!("Server listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}

// --- 5. The API Route Handler ---
async fn claim_handler(
    State(state): State<AppState>,
    Json(payload): Json<ClaimRequest>,
) -> Result<impl IntoResponse, AppError> {
    info!("Received claim for nullifier: {}", payload.nullifier);

    // 1. Check & Insert Nullifier
    let inserted = check_and_insert_nullifier(&state.pool, &payload.nullifier).await?;

    if !inserted {
        info!("Claim rejected: nullifier already exists.");
        return Err(AppError::AlreadyClaimed);
    }

    // 2. If new, mint tokens and broadcast the transaction
    info!("Nullifier is new. Minting tokens...");
    let tx_hash = mint_tokens(
        &state.provider,
        &state.token_contract,
        &payload.wallet_address,
    )
    .await?;

    info!("Transaction broadcasted: {}", tx_hash);

    // 3. Update the database with the transaction hash
    update_claim_with_tx_hash(&state.pool, &payload.nullifier, &tx_hash).await?;
    info!("Database updated with tx_hash: {}", tx_hash);

    // 4. Send back the tx_hash
    Ok((StatusCode::OK, Json(ClaimResponse { tx_hash })))
}

// --- 6. Database Logic ---
async fn check_and_insert_nullifier(pool: &PgPool, nullifier: &str) -> Result<bool, AppError> {
    let result = sqlx::query!("INSERT INTO claims (nullifier) VALUES ($1)", nullifier)
        .execute(pool)
        .await;

    match result {
        Ok(_) => Ok(true),
        Err(e) => {
            if let Some(db_err) = e.as_database_error() {
                if db_err.is_unique_violation() {
                    Ok(false)
                } else {
                    Err(AppError::DatabaseError(e))
                }
            } else {
                Err(AppError::DatabaseError(e))
            }
        }
    }
}

async fn update_claim_with_tx_hash(
    pool: &PgPool,
    nullifier: &str,
    tx_hash: &str,
) -> Result<(), AppError> {
    sqlx::query!(
        "UPDATE claims SET tx_hash = $1, claimed_at = NOW() WHERE nullifier = $2",
        tx_hash,
        nullifier
    )
    .execute(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(())
}

// --- 7. Token Minting Logic ---
async fn mint_tokens(
    provider: &WsProvider,
    token_contract_address: &Address,
    wallet_address: &str,
) -> Result<String, AppError> {
    // Parse the recipient address
    let to_address: Address = wallet_address
        .parse()
        .map_err(|e| AppError::InvalidAddress(format!("{}", e)))?;

    // Get the claim amount from environment (in token's smallest unit)
    // For 18 decimals: 1 token = 1000000000000000000 (1e18)
    let claim_amount = (100 * 10u128.pow(18)).to_string(); // Example: 100 tokens with 18 decimals

    let amount: U256 = claim_amount
        .parse()
        .map_err(|e| AppError::TransactionError(format!("Invalid claim amount: {}", e)))?;

    // Create contract instance
    let contract = TestHumnToken::new(*token_contract_address, provider);

    info!("Minting {} tokens to {}", amount, wallet_address);

    // Call the mint function
    let tx_builder = contract.mint(to_address, amount);

    // Send the transaction
    let pending_tx = tx_builder
        .send()
        .await
        .map_err(|e| AppError::TransactionError(format!("Failed to send transaction: {}", e)))?;

    let tx_hash = *pending_tx.tx_hash();
    info!("Transaction sent with hash: {:#x}", tx_hash);

    // Optional: Wait for confirmation (recommended for production)
    // Uncomment if you want to wait for the transaction to be mined
    // let receipt = pending_tx.get_receipt()
    //     .await
    //     .map_err(|e| AppError::TransactionError(format!("Failed to get receipt: {}", e)))?;
    //
    // if !receipt.status() {
    //     return Err(AppError::TransactionError("Transaction reverted".to_string()));
    // }
    //
    // info!("Transaction confirmed in block: {:?}", receipt.block_number);

    Ok(format!("{:#x}", tx_hash))
}
