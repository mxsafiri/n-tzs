import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { requireRole, getCurrentDbUser } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { users, depositRequests, depositApprovals, banks, wallets } from '@ntzs/db'

async function approveDepositAction(formData: FormData) {
  'use server'

  await requireRole('super_admin')
  const currentUser = await getCurrentDbUser()
  if (!currentUser) throw new Error('User not found')

  const depositId = String(formData.get('depositId') ?? '')
  const decision = String(formData.get('decision') ?? '') as 'approved' | 'rejected'
  const reason = String(formData.get('reason') ?? '')

  if (!depositId || !['approved', 'rejected'].includes(decision)) {
    throw new Error('Invalid parameters')
  }

  const { db } = getDb()

  // Get the deposit request
  const [deposit] = await db
    .select()
    .from(depositRequests)
    .where(eq(depositRequests.id, depositId))
    .limit(1)

  if (!deposit) {
    throw new Error('Deposit not found')
  }

  // Create platform approval
  await db.insert(depositApprovals).values({
    depositRequestId: depositId,
    approverUserId: currentUser.id,
    approvalType: 'platform',
    decision,
    reason: reason || null,
  })

  // Update deposit status based on decision
  const newStatus = decision === 'approved' ? 'platform_approved' : 'rejected'
  
  await db
    .update(depositRequests)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(depositRequests.id, depositId))

  revalidatePath('/backstage/minting')
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    kyc_pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    kyc_approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    kyc_rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    awaiting_fiat: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    fiat_confirmed: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    bank_approved: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    platform_approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    mint_pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    mint_processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    minted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    mint_failed: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    cancelled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.submitted}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default async function MintingPage() {
  const { db } = getDb()

  // Fetch all deposit requests with related data
  const allDeposits = await db
    .select({
      id: depositRequests.id,
      amountTzs: depositRequests.amountTzs,
      status: depositRequests.status,
      chain: depositRequests.chain,
      createdAt: depositRequests.createdAt,
      userEmail: users.email,
      userId: users.id,
      bankName: banks.name,
      walletAddress: wallets.address,
    })
    .from(depositRequests)
    .innerJoin(users, eq(depositRequests.userId, users.id))
    .innerJoin(banks, eq(depositRequests.bankId, banks.id))
    .innerJoin(wallets, eq(depositRequests.walletId, wallets.id))
    .orderBy(desc(depositRequests.createdAt))
    .limit(200)

  const pendingApproval = allDeposits.filter(d => d.status === 'bank_approved').length
  const totalMinted = allDeposits.filter(d => d.status === 'minted').length
  const totalVolume = allDeposits
    .filter(d => d.status === 'minted')
    .reduce((sum, d) => sum + d.amountTzs, 0)

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="border-b border-white/10 bg-zinc-950/50">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Minting Queue</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Approve deposit requests and manage nTZS minting
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
            <p className="text-2xl font-bold text-white">{allDeposits.length}</p>
            <p className="text-sm text-zinc-500">Total Requests</p>
          </div>
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-2xl font-bold text-violet-400">{pendingApproval}</p>
            <p className="text-sm text-zinc-500">Awaiting Approval</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-2xl font-bold text-emerald-400">{totalMinted}</p>
            <p className="text-sm text-zinc-500">Successfully Minted</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-2xl font-bold text-blue-400">{totalVolume.toLocaleString()}</p>
            <p className="text-sm text-zinc-500">Total TZS Minted</p>
          </div>
        </div>

        {/* Deposits Table */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/80">
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Bank</th>
                  <th className="px-6 py-4">Wallet</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      </svg>
                      <p className="mt-4 text-zinc-500">No deposit requests yet</p>
                    </td>
                  </tr>
                ) : (
                  allDeposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{dep.userEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-lg font-bold text-emerald-400">
                          {dep.amountTzs.toLocaleString()}
                        </div>
                        <div className="text-xs text-zinc-500">TZS</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{dep.bankName}</td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-300 truncate max-w-[120px] block" title={dep.walletAddress}>
                          {dep.walletAddress.slice(0, 8)}...{dep.walletAddress.slice(-6)}
                        </code>
                        <div className="mt-1 text-xs text-zinc-600">{dep.chain}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={dep.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {dep.createdAt ? new Date(dep.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {dep.status === 'bank_approved' ? (
                          <div className="flex gap-2">
                            <form action={approveDepositAction}>
                              <input type="hidden" name="depositId" value={dep.id} />
                              <input type="hidden" name="decision" value="approved" />
                              <button
                                type="submit"
                                className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                Approve Mint
                              </button>
                            </form>
                            <form action={approveDepositAction}>
                              <input type="hidden" name="depositId" value={dep.id} />
                              <input type="hidden" name="decision" value="rejected" />
                              <button
                                type="submit"
                                className="rounded-lg bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
