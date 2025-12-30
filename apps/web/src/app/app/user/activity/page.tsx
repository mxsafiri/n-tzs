import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'

import { requireDbUser, requireRole } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { depositRequests, kycCases, wallets } from '@ntzs/db'

import { GlassPanel } from '../../_components/GlassPanel'

export default async function ActivityPage() {
  await requireRole('end_user')
  const dbUser = await requireDbUser()

  const { db } = getDb()

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, dbUser.id),
  })

  const latestKyc = await db
    .select({ status: kycCases.status, createdAt: kycCases.createdAt })
    .from(kycCases)
    .where(eq(kycCases.userId, dbUser.id))
    .orderBy(desc(kycCases.createdAt))
    .limit(1)

  const deposits = await db
    .select({
      id: depositRequests.id,
      amountTzs: depositRequests.amountTzs,
      status: depositRequests.status,
      createdAt: depositRequests.createdAt,
    })
    .from(depositRequests)
    .where(eq(depositRequests.userId, dbUser.id))
    .orderBy(desc(depositRequests.createdAt))
    .limit(50)

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel title="Activity" description="Review your wallet setup and deposit history.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/60">Wallet</div>
            <div className="mt-2 text-sm font-semibold">{wallet ? 'Connected' : 'Not set'}</div>
            <div className="mt-2 break-all font-mono text-xs text-white/60">
              {wallet?.address ?? '—'}
            </div>
            <div className="mt-3">
              <Link href="/app/user/wallet" className="text-sm text-white underline underline-offset-4">
                Manage wallet
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/60">Identity check</div>
            <div className="mt-2 text-sm font-semibold">{latestKyc[0]?.status ?? 'Not started'}</div>
            <div className="mt-3">
              <Link href="/app/user/kyc" className="text-sm text-white underline underline-offset-4">
                View status
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/60">Deposits</div>
            <div className="mt-2 text-sm font-semibold">{deposits.length}</div>
            <div className="mt-3">
              <Link href="/app/user/deposits/new" className="text-sm text-white underline underline-offset-4">
                Create a deposit
              </Link>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel title="Deposit history">
        {deposits.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/60">
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Amount (TZS)</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-white/10">
                    <td className="py-2 pr-4">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{d.amountTzs}</td>
                    <td className="py-2 pr-4">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            No deposits yet.
          </div>
        )}
      </GlassPanel>
    </main>
  )
}
