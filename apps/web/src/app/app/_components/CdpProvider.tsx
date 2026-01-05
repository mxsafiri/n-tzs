'use client'

import type { ReactNode } from 'react'
import { useMemo, useCallback } from 'react'
import { CDPHooksProvider, type Config } from '@coinbase/cdp-hooks'

export function CdpProvider({
  children,
  enabled = true,
}: {
  children: ReactNode
  enabled?: boolean
}) {
  const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID

  // Use our custom ES256-signed JWT endpoint for CDP compatibility
  const getJwt = useCallback(async () => {
    try {
      console.log('[CDP] Fetching ES256 JWT from /api/auth/cdp-token...')
      const response = await fetch('/api/auth/cdp-token', {
        credentials: 'include', // Include cookies for session validation
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[CDP] Token fetch failed:', error)
        throw new Error(error.error || 'Failed to get CDP token')
      }

      const { token } = await response.json()
      if (!token) {
        throw new Error('No token returned from CDP token endpoint')
      }

      console.log('[CDP] Got ES256 JWT successfully')
      return token
    } catch (err) {
      console.error('[CDP] getJwt error:', err)
      throw err
    }
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('[CDP] SDK Error:', error.message, error)
  }, [])

  const config = useMemo<Config | null>(() => {
    if (!enabled) return null
    if (!projectId) {
      console.warn('[CDP] Missing NEXT_PUBLIC_CDP_PROJECT_ID')
      return null
    }

    console.log('[CDP] Initializing with projectId:', projectId.slice(0, 8) + '...')

    return {
      projectId,
      appName: 'nTZS',
      customAuth: {
        getJwt,
      },
      onError: handleError,
    }
  }, [enabled, projectId, getJwt, handleError])

  if (!config) {
    return children
  }

  return <CDPHooksProvider config={config}>{children}</CDPHooksProvider>
}
