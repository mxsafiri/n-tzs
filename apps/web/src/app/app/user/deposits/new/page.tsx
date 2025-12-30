import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireDbUser, requireRole } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { banks, kycCases, wallets } from '@ntzs/db'

import { GlassPanel } from '../../../_components/GlassPanel'
import { createDepositRequestAction } from './actions'

export default async function NewDepositPage() {
  await requireRole('end_user')
  const dbUser = await requireDbUser()

  const { db } = getDb()

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, dbUser.id),
  })

  if (!wallet) {
    redirect('/app/user/wallet')
  }

  const latestKyc = await db
    .select({ status: kycCases.status })
    .from(kycCases)
    .where(eq(kycCases.userId, dbUser.id))
    .orderBy(desc(kycCases.createdAt))
    .limit(1)

  const kycStatus = latestKyc[0]?.status ?? null

  if (kycStatus !== 'approved') {
    redirect('/app/user/kyc')
  }

  const activeBanks = await db
    .select({ id: banks.id, name: banks.name })
    .from(banks)
    .where(eq(banks.status, 'active'))
    .orderBy(banks.name)
    .limit(50)

  return (
    <main className="flex flex-col gap-6">
      <GlassPanel
        title="New deposit"
        description="Create a deposit request so your payment can be tracked and confirmed."
      >
        {activeBanks.length ? (
          <form action={createDepositRequestAction} className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-white/70">Amount (TZS)</span>
                <input
                  name="amountTzs"
                  type="number"
                  min={1}
                  step={1}
                  required
                  className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-white/70">Settlement bank</span>
                <select
                  name="bankId"
                  required
                  defaultValue={activeBanks[0]?.id}
                  className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none"
                >
                  {activeBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                Create deposit request
              </button>
              <Link
                href="/app/user"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm text-white/80 backdrop-blur-lg transition-colors hover:bg-white/10"
              >
                Back
              </Link>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            No settlement bank is configured yet.
          </div>
        )}
      </GlassPanel>
    </main>
  )
}
