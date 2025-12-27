import { requireRole } from '@/lib/auth/rbac'
import { GlassPanel } from '../_components/GlassPanel'

export default async function ComplianceDashboard() {
  await requireRole('platform_compliance')

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel
        title="Compliance review"
        description="Approve deposits for issuance based on policy checks and provide a clear audit trail for oversight."
      />

      <GlassPanel
        title="Review pipeline"
        description="Next we’ll add the compliance approval queue, decision notes, and escalation flow for exceptions."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Awaiting review</div>
            <p className="mt-2 text-sm text-white/70">Deposits waiting for approval.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Approved</div>
            <p className="mt-2 text-sm text-white/70">Cleared to move to settlement.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Rejected / hold</div>
            <p className="mt-2 text-sm text-white/70">Items requiring follow-up.</p>
          </div>
        </div>
      </GlassPanel>
    </main>
  )
}
