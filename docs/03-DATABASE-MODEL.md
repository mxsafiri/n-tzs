# Database Model

This project uses Postgres (Neon) with a Drizzle schema in `packages/db/src/schema.ts`.

## Core Tables

### `users`

- Identifies application users.
- Includes role-based access control via `users.role`.

Key columns:

- `id`
- `neon_auth_user_id`
- `email`
- `role`: `end_user | bank_admin | platform_compliance | super_admin`

### `wallets`

- Stores user wallets for supported chains.

Key columns:

- `user_id` (FK)
- `chain`
- `address`
- `provider` and verification fields

### `deposit_requests`

Primary off-chain state machine for issuance.

Key columns:

- `id`
- `user_id`, `bank_id`, `wallet_id`
- `chain`
- `amount_tzs`
- `status`
- PSP fields: `payment_provider`, `psp_reference`, `psp_channel`, `buyer_phone`
- Fiat confirmation fields: `fiat_confirmed_at`, `fiat_confirmed_by_user_id`

### `deposit_approvals`

- Records approvals/decisions (bank and platform) for deposits.

### `mint_transactions`

- Stores the relationship between a deposit and an on-chain transaction.

Key columns:

- `deposit_request_id` (unique / conflict target)
- `chain`
- `contract_address`
- `tx_hash`
- `status`
- `error`

### `daily_issuance`

- Enforces a daily issuance cap.

Key columns:

- `day` (primary key)
- `cap_tzs`
- `reserved_tzs`
- `issued_tzs`

### `audit_logs`

- Stores security-relevant actions and metadata.

Key columns:

- `action`
- `entity_type`, `entity_id`
- `metadata` (JSON)

## Reconciliation

### Problem

On-chain activity can occur outside the normal deposit-driven workflow (test mints, manual mints, operational mistakes). In such cases, the on-chain supply may not match the sum of DB deposits recorded as minted.

### Table: `reconciliation_entries`

Purpose:

- Explain and account for on-chain supply that is not represented by a `deposit_request`.

Key columns:

- `chain`
- `tx_hash` (unique)
- `to_address`
- `amount_tzs`
- `entry_type`: `untracked_mint | test_mint | manual_correction | double_mint | other`
- `reason`
- `notes`
- `created_by_user_id`

### How the dashboard computes totals

- `DB Minted`: sum of `deposit_requests.amount_tzs` where status is `minted`
- `Reconciled`: sum of `reconciliation_entries.amount_tzs`
- `Total Tracked`: `DB Minted + Reconciled`
- `Discrepancy`: `on_chain_total_supply - Total Tracked`

## Suggested auditor checks

- Validate that deposit state transitions are monotonic and authorized.
- Verify that minting updates are consistent:
  - `deposit_requests.status = minted`
  - `mint_transactions.status = minted`
  - `mint_transactions.tx_hash` is populated
- Verify daily issuance math and reservation/commit semantics.
- Verify reconciliation entries have adequate controls:
  - Only privileged admins can create entries
  - Entries are immutable (no edits/deletes) in the application logic
