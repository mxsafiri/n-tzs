# Security Model and Threats

This document describes the security posture, assumptions, and primary risks.

## Trust Model

### On-chain

- On-chain `totalSupply` and `Transfer` events are the source of truth for token issuance.
- Administrative powers exist (pause, freeze, blacklist, wipe).
- The Safe (multisig) is intended to control high-privilege actions.

### Off-chain

- Database is the system of record for off-chain approvals and deposit tracking.
- Worker is a privileged issuer component.
- Web app and worker both require secure configuration and secrets management.

## Assets to protect

- `MINTER_PRIVATE_KEY` (if used)
- Safe keys and Safe configuration
- Postgres `DATABASE_URL`
- ZenoPay API key
- Admin accounts (application roles)

## Primary Threats

### Unauthorized minting

Risk:

- If the minter key is compromised, an attacker could mint tokens.

Mitigations:

- Use Safe multisig for minting, or at minimum restrict minter key to minimal permissions.
- Operationally rotate minter keys.
- Monitor on-chain mint events (`Transfer` from zero address).
- Enforce issuance caps (`daily_issuance`) off-chain.

### Replay / duplicate mint processing

Risk:

- Worker could mint twice for the same deposit if job claiming is not atomic.

Mitigations:

- Atomic claim query using row locks and `skip locked`.
- Single `mint_transactions` row per `deposit_request_id`.

### Incorrect advancement of deposits

Risk:

- Deposits could be advanced to `mint_pending` without actual fiat confirmation.

Mitigations:

- Webhook only advances on `payment_status == COMPLETED`.
- Worker polling uses PSP order status.
- Manual overrides require explicit admin input and should be used only after verifying PSP dashboard.

### Webhook spoofing

Risk:

- An attacker could call the webhook endpoint.

Mitigations:

- The webhook handler only updates an existing deposit in `submitted` state.
- Logs IP and can be tightened to whitelist known ZenoPay IP ranges.
- The canonical source of truth remains the PSP order-status query and on-chain events.

Recommendation:

- If ZenoPay provides a signed payload mechanism, implement signature verification.

### Database compromise

Risk:

- If DB is compromised, an attacker can manipulate off-chain records.

Mitigations:

- Treat DB as non-authoritative for supply.
- Reconciliation model ensures on-chain supply is compared to DB-tracked totals.
- Least-privilege database users.

## Security invariants

- A `deposit_request` should only become `minted` if there exists a successful on-chain mint.
- `mint_transactions.tx_hash` should be present for `minted` deposits.
- For Safe mints, the tx hash must be validated by reading logs and matching expected Transfer.

## Audit focus areas

- Smart contract access control and administrative powers
- Worker minting logic, idempotency, and error handling
- Deposit advancement logic and authorization
- Secret management and operational procedures
