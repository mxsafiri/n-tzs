# Operations Runbook

This is an operator-focused guide for running and troubleshooting the system.

## Environments

- Testnet: Base Sepolia
- Database: Neon Postgres

## Required Secrets / Configuration

- `DATABASE_URL`
- `BASE_SEPOLIA_RPC_URL`
- `NTZS_CONTRACT_ADDRESS_BASE_SEPOLIA`
- `MINTER_PRIVATE_KEY` (if worker mints directly)
- `ZENOPAY_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `DAILY_ISSUANCE_CAP_TZS`

## Start services

### Web

- Start Next.js app in `apps/web`.

### Worker

- Start worker in `apps/worker`.
- Worker runs a continuous loop:
  - Poll ZenoPay for completed payments (fallback)
  - Process one mint job

## Monitoring

Recommended monitoring signals:

- On-chain `Transfer` events from zero address (mints)
- Deposit queue size:
  - count of `mint_pending`, `mint_processing`, `mint_failed`, `mint_requires_safe`
- Worker logs:
  - successful mint events
  - error rates
- Discrepancy between on-chain supply and DB tracked total

## Handling common issues

### Webhook not firing

Symptoms:

- Deposits remain `submitted` after user confirms payment.

Actions:

- Confirm that `NEXT_PUBLIC_APP_URL` is set correctly and is reachable.
- Confirm ZenoPay is calling `/api/webhooks/zenopay`.
- Rely on worker polling fallback.

### ZenoPay order-status is empty or unreliable

Actions:

- Use Backstage manual transaction-id input after confirming in ZenoPay dashboard.

### Mint failures

Symptoms:

- Deposits stuck in `mint_failed`.

Actions:

- Check RPC availability.
- Validate `MINTER_PRIVATE_KEY` has `MINTER_ROLE` on the token contract.
- Use the Backstage retry action.

### Daily issuance cap exceeded

Symptoms:

- Mint transactions marked as cap exceeded.

Actions:

- Increase `DAILY_ISSUANCE_CAP_TZS` for test environments.
- Wait for next UTC day rollover.

## Safe mint operations

For deposits requiring Safe:

- A Safe transaction executes the mint.
- After execution, admin records the tx hash in Backstage.
- The app verifies the mint by inspecting transaction receipt logs for the expected `Transfer` event.

## Reconciliation procedure

If on-chain supply differs from DB totals:

1. Identify the mint transaction(s) on-chain.
2. Determine whether each mint corresponds to a deposit:
   - If yes but missing in DB, investigate missing `mint_transactions` and fix.
   - If no (manual/test mint), record a `reconciliation_entries` row.
3. Confirm that:
   - `On-Chain Supply == DB Minted + Reconciled`

## Key rotation

- Rotate the minter key if it is ever exposed.
- Prefer using Safe-based minting for higher security.

## Incident response

- If suspicious mint occurs:
  - Pause the token (Safe) to stop transfers if required.
  - Assess impacted addresses.
  - Use blacklist/freeze tools according to legal/compliance policy.
  - Record a reconciliation entry and produce an incident report.
