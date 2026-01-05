import Link from 'next/link'
import { eq, desc } from 'drizzle-orm'

import { requireRole, requireDbUser } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { wallets, depositRequests } from '@ntzs/db'

export default async function UserDashboard() {
  await requireRole('end_user')
  const dbUser = await requireDbUser()
  const { db } = getDb()

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, dbUser.id),
  })

  const recentDeposits = await db
    .select()
    .from(depositRequests)
    .where(eq(depositRequests.userId, dbUser.id))
    .orderBy(desc(depositRequests.createdAt))
    .limit(5)

  const pendingCount = recentDeposits.filter(d => !['minted', 'rejected', 'cancelled'].includes(d.status)).length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="px-8 py-6">
          <p className="text-sm text-zinc-400">Welcome back</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{dbUser.email}</h1>
        </div>
      </div>

      <div className="p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Balance Card */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-black to-purple-950/30 p-8">
              {/* Decorative elements */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-400">Total Balance</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    nTZS
                  </span>
                </div>
                
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-5xl font-bold tracking-tight text-white">0.00</span>
                  <span className="text-lg text-zinc-500">TZS</span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-zinc-500">≈ $0.00 USD</span>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/app/user/deposits/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:scale-105"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Deposit
                  </Link>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/60 cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    Send
                  </button>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/60 cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="font-semibold text-white">Recent Transactions</h2>
                <Link href="/app/user/activity" className="text-sm text-violet-400 hover:text-violet-300">
                  View all →
                </Link>
              </div>
              <div className="p-4">
                {recentDeposits.length === 0 ? (
                  <div className="py-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                    <p className="mt-4 text-sm text-zinc-500">No transactions yet</p>
                    <p className="mt-1 text-xs text-zinc-600">Make your first deposit to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentDeposits.map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/[0.07]">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-white">Deposit</p>
                            <p className="text-xs text-zinc-500">
                              {deposit.createdAt ? new Date(deposit.createdAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-medium text-emerald-400">
                            +{deposit.amountTzs.toLocaleString()} TZS
                          </p>
                          <p className={`text-xs capitalize ${
                            deposit.status === 'minted' ? 'text-emerald-400' :
                            deposit.status === 'rejected' ? 'text-rose-400' :
                            'text-amber-400'
                          }`}>
                            {deposit.status.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Wallet Card */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${wallet ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                  <svg className={`h-6 w-6 ${wallet ? 'text-emerald-400' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">{wallet ? 'Wallet Ready' : 'Setup Wallet'}</p>
                  <p className="text-xs text-zinc-500">
                    {wallet ? 'Secure & recoverable' : 'Required for deposits'}
                  </p>
                </div>
              </div>
              {wallet ? (
                <div className="mt-4 rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-zinc-500">Address</p>
                  <p className="mt-1 truncate font-mono text-sm text-white">{wallet.address}</p>
                </div>
              ) : (
                <Link
                  href="/app/user/wallet"
                  className="mt-4 block w-full rounded-xl bg-violet-500 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-violet-600"
                >
                  Create Wallet
                </Link>
              )}
            </div>

            {/* Rewards Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 to-purple-950/30 p-6">
              <h3 className="font-semibold text-white">Rewards</h3>
              <p className="mt-1 text-xs text-zinc-500">Earn more with nTZS</p>

              <div className="mt-4 space-y-3">
                <Link href="/app/user/invite" className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Invite a friend</p>
                    <p className="text-xs text-zinc-500">Earn 5,000 TZS bonus</p>
                  </div>
                  <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>

                <Link href="/app/user/stake" className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                    <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Stake to Earn</p>
                    <p className="text-xs text-zinc-500">Up to 8% APY</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    NEW
                  </span>
                </Link>
              </div>
            </div>

            {/* Status Card */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
              <h3 className="font-semibold text-white">Account Status</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">KYC Verified</span>
                  <span className="flex items-center gap-1 text-sm text-emerald-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Complete
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Pending Deposits</span>
                  <span className="text-sm text-white">{pendingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Wallet Status</span>
                  <span className={`text-sm ${wallet ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {wallet ? 'Active' : 'Not Setup'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
