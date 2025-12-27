import Link from 'next/link'

import { requireRole } from '@/lib/auth/rbac'
import { GlassPanel } from '../_components/GlassPanel'

function MiniCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-white/60">{hint}</div>
    </div>
  )
}

export default async function UserDashboard() {
  await requireRole('end_user')

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel
        title="Your digital asset account"
        description="Track deposits, view issuance progress, and manage your nTZS position through a secure payments and settlement experience."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app/user/deposits/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          >
            Make a deposit
          </Link>
          <Link
            href="/app/user/activity"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm text-white/80 backdrop-blur-lg transition-colors hover:bg-white/10"
          >
            View activity
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MiniCard title="Available" value="nTZS" hint="Ready to settle" />
          <MiniCard title="In progress" value="Deposits" hint="Under review" />
          <MiniCard title="Wallet" value="Secure" hint="Embedded and recoverable" />
        </div>
      </GlassPanel>

      <GlassPanel
        title="Next steps"
        description="Start with a deposit. We’ll guide you with clear instructions and keep you updated until issuance is complete."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Deposit instructions</div>
            <p className="mt-2 text-sm text-white/70">
              Receive a reference and payment details designed for reliable tracking.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Review and controls</div>
            <p className="mt-2 text-sm text-white/70">
              Deposits are reconciled with policy checks and an audit trail.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Issuance completion</div>
            <p className="mt-2 text-sm text-white/70">
              Once approved, your nTZS position becomes available in your account.
            </p>
          </div>
        </div>
      </GlassPanel>
    </main>
  )
}
