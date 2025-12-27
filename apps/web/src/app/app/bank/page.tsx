import { requireRole } from '@/lib/auth/rbac'
import { GlassPanel } from '../_components/GlassPanel'

export default async function BankDashboard() {
  await requireRole('bank_admin')

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel
        title="Bank operations"
        description="Review incoming deposits, confirm settlement, and maintain a reliable payment pipeline for issuance."
      />

      <GlassPanel
        title="Queues"
        description="This is the operational view for bank admins. Next we’ll add the deposit confirmation queue and reconciliation tools."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Pending confirmation</div>
            <p className="mt-2 text-sm text-white/70">Deposits awaiting bank confirmation.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Confirmed today</div>
            <p className="mt-2 text-sm text-white/70">Settled items ready for review.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Exceptions</div>
            <p className="mt-2 text-sm text-white/70">Items that need manual matching.</p>
          </div>
        </div>
      </GlassPanel>
    </main>
  )
}
