'use client'

import { useMemo, useState } from 'react'

import {
  useAuthenticateWithJWT,
  useCreateEvmEoaAccount,
  useCurrentUser,
  useEvmAddress,
  useIsInitialized,
} from '@coinbase/cdp-hooks'

import { saveEmbeddedWalletAction } from './actions'

type UiStatus = 'idle' | 'authenticating' | 'creating_wallet'

export function WalletSetupClient() {
  const { isInitialized } = useIsInitialized()
  const { currentUser } = useCurrentUser()
  const { evmAddress } = useEvmAddress()
  const { authenticateWithJWT } = useAuthenticateWithJWT()
  const { createEvmEoaAccount } = useCreateEvmEoaAccount()

  const [status, setStatus] = useState<UiStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const canAuthenticate = isInitialized && !currentUser
  const canCreateWallet = isInitialized && Boolean(currentUser) && !evmAddress

  const addressToSave = useMemo(() => {
    if (!evmAddress) return ''
    return String(evmAddress)
  }, [evmAddress])

  async function handleAuthenticate() {
    setError(null)
    setStatus('authenticating')

    try {
      await authenticateWithJWT()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate')
    } finally {
      setStatus('idle')
    }
  }

  async function handleCreateWallet() {
    setError(null)
    setStatus('creating_wallet')

    try {
      await createEvmEoaAccount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold">Status</div>
        <div className="mt-2 text-sm text-white/70">
          {isInitialized ? 'Wallet services are ready.' : 'Preparing wallet services…'}
        </div>
        {error ? <div className="mt-2 text-sm text-red-200">{error}</div> : null}
      </div>

      {evmAddress ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm font-semibold">Wallet address</div>
          <div className="mt-2 break-all font-mono text-xs text-white/70">{String(evmAddress)}</div>

          <form action={saveEmbeddedWalletAction} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="address" value={addressToSave} />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              Save wallet
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm font-semibold">Set up your wallet</div>
          <div className="mt-2 text-sm text-white/70">
            Create a secure embedded wallet that can receive settlements.
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAuthenticate}
              disabled={!canAuthenticate || status !== 'idle'}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-60"
            >
              Connect
            </button>
            <button
              type="button"
              onClick={handleCreateWallet}
              disabled={!canCreateWallet || status !== 'idle'}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm text-white/80 backdrop-blur-lg transition-colors hover:bg-white/10 disabled:opacity-60"
            >
              Create wallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
