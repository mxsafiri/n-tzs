import { requireRole } from '@/lib/auth/rbac'

import { GlassPanel } from '../../_components/GlassPanel'
import { WalletSetupClient } from '@/app/app/user/wallet/WalletSetupClient'

export default async function WalletPage() {
  await requireRole('end_user')

  const hasCdpProjectId = Boolean(process.env.NEXT_PUBLIC_CDP_PROJECT_ID)

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel
        title="Secure wallet"
        description="Set up your secure embedded wallet to receive settlements."
      >
        {hasCdpProjectId ? (
          <WalletSetupClient />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            Add NEXT_PUBLIC_CDP_PROJECT_ID to your environment to enable wallet setup.
          </div>
        )}
      </GlassPanel>
    </main>
  )
}
