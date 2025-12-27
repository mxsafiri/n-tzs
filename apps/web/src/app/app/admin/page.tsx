import Link from 'next/link'

import { requireRole } from '@/lib/auth/rbac'
import { GlassPanel } from '../_components/GlassPanel'

export default async function AdminDashboard() {
  await requireRole('super_admin')

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel
        title="Platform administration"
        description="Manage roles, operational controls, and digital asset issuance settings."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/backstage"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          >
            Open Backstage
          </Link>
          <Link
            href="/ops"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm text-white/80 backdrop-blur-lg transition-colors hover:bg-white/10"
          >
            Operations
          </Link>
        </div>
      </GlassPanel>

      <GlassPanel
        title="Controls"
        description="Administrative actions should be executed through controlled workflows, with review and auditability."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Roles</div>
            <p className="mt-2 text-sm text-white/70">Assign access for operators and reviewers.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Issuance controls</div>
            <p className="mt-2 text-sm text-white/70">Policy actions executed via multisig.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Audit trail</div>
            <p className="mt-2 text-sm text-white/70">Track all approvals and settlements.</p>
          </div>
        </div>
      </GlassPanel>
    </main>
  )
}
