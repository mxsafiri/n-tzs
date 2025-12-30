'use client'

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { CDPHooksProvider, type Config } from '@coinbase/cdp-hooks'

import { authClient } from '@/lib/auth/client'

export function CdpProvider({
  children,
  enabled = true,
}: {
  children: ReactNode
  enabled?: boolean
}) {
  const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID

  const config = useMemo<Config | null>(() => {
    if (!enabled) return null
    if (!projectId) return null

    return {
      projectId,
      appName: 'nTZS',
      customAuth: {
        getJwt: async () => {
          const tokenResult = await authClient.token()
          const jwt = tokenResult.data?.token
          if (jwt) return jwt

          const sessionResult = await authClient.getSession()
          const sessionToken = sessionResult.data?.session?.token
          if (sessionToken) return sessionToken

          const tokenErr = tokenResult.error
          const sessionErr = sessionResult.error

          throw new Error(
            tokenErr?.message ??
              sessionErr?.message ??
              'Unable to retrieve Neon Auth token for Coinbase CDP'
          )
        },
      },
    }
  }, [enabled, projectId])

  if (!config) {
    return children
  }

  return <CDPHooksProvider config={config}>{children}</CDPHooksProvider>
}
