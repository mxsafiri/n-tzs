# Smart Contract

Contract source: `packages/contracts/contracts/NTZS.sol`

## Summary

`NTZS` is an ERC-20 token contract with additional administrative controls designed for compliance and operational safety.

- ERC-20 token name/symbol: `nTZS` / `nTZS`
- Pausable transfers
- Role-based mint and burn
- Account freeze (prevents sending)
- Account blacklist (prevents sending/receiving; allows wipe)
- Wipe: burn the entire balance of a blacklisted address

## Roles

The contract uses OpenZeppelin `AccessControl`.

- `DEFAULT_ADMIN_ROLE`
- `MINTER_ROLE`
- `BURNER_ROLE`
- `PAUSER_ROLE`
- `FREEZER_ROLE`
- `BLACKLISTER_ROLE`
- `WIPER_ROLE`

On deployment:

- `safeAdmin` is granted all operational roles above.
- `msg.sender` (deployer) is also granted `DEFAULT_ADMIN_ROLE`.

The deployer can remove their admin privileges by calling:

- `renounceDeployerAdmin()`

## Public Functions

- `pause()` / `unpause()`
  - Only `PAUSER_ROLE`
- `mint(address to, uint256 amount)`
  - Only `MINTER_ROLE`
- `burn(address from, uint256 amount)`
  - Only `BURNER_ROLE`
- `freeze(address account)` / `unfreeze(address account)`
  - Only `FREEZER_ROLE`
- `blacklist(address account)` / `unblacklist(address account)`
  - Only `BLACKLISTER_ROLE`
- `wipeBlacklisted(address account)`
  - Only `WIPER_ROLE`
  - Requires account is blacklisted
  - Burns full balance

## Transfer Restrictions

The contract overrides `_update` to enforce:

- If `from != address(0)`, then:
  - `from` must not be frozen
  - If `from` is blacklisted, transfer is blocked unless it is a wipe burn executed by an address with `WIPER_ROLE`
- If `to != address(0)`, then:
  - `to` must not be blacklisted

Implications:

- Frozen accounts can still receive but cannot send.
- Blacklisted accounts cannot send.
- Transfers to blacklisted accounts are blocked.
- A wipe operation burns the blacklisted account balance.

## Events

- `Frozen(address)` / `Unfrozen(address)`
- `Blacklisted(address)` / `Unblacklisted(address)`
- `Wiped(address, uint256 amount)`

Standard ERC-20 `Transfer` events also serve as the canonical mint/burn signal.

## Integration assumptions

- Mint worker uses a key that must have `MINTER_ROLE`.
- For high-value mints requiring Safe multisig, the Safe must hold `MINTER_ROLE`.

## Suggested auditor checks

- Validate access control configuration at deployment.
- Confirm that `renounceDeployerAdmin()` is called (or equivalent) in operational procedures if the deployer should not retain admin rights.
- Validate transfer restriction logic in `_update`:
  - No bypasses for frozen/blacklisted behavior except explicitly intended wipe burn.
- Validate pausable behavior applies as expected.
