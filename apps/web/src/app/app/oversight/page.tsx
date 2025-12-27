import { requireAnyRole } from '@/lib/auth/rbac'
import { GlassPanel } from '../_components/GlassPanel'

export default async function OversightDashboard() {
  await requireAnyRole(['platform_compliance', 'super_admin'])

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel
        title="Oversight"
        description="Monitor deposits, approvals, and issuance with a clear end-to-end audit view."
      />

      <GlassPanel
        title="Transparency view"
        description="Next we’ll add filters and reporting for deposit flows, decision timelines, and settlement results."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Deposit flow</div>
            <p className="mt-2 text-sm text-white/70">Track status progression and exceptions.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Approvals</div>
            <p className="mt-2 text-sm text-white/70">Review decisions and audit notes.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Settlement</div>
            <p className="mt-2 text-sm text-white/70">See issuance results and timing.</p>
          </div>
        </div>
      </GlassPanel>
    </main>
  )
}
