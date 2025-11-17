-- Add migration script here
-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    nullifier VARCHAR(255) NOT NULL UNIQUE,
    tx_hash VARCHAR(66),  -- Ethereum tx hash format: 0x + 64 hex chars
    claimed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on nullifier for faster lookups
CREATE INDEX IF NOT EXISTS idx_claims_nullifier ON claims(nullifier);

-- Create index on tx_hash for lookups
CREATE INDEX IF NOT EXISTS idx_claims_tx_hash ON claims(tx_hash);