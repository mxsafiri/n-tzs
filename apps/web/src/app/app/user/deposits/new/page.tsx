import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireDbUser, requireRole } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { banks, kycCases, wallets } from '@ntzs/db'

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
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="px-8 py-6">
          <Link href="/app/user" className="mb-2 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>
          <p className="mt-1 text-sm text-zinc-400">Convert TZS to nTZS stablecoin</p>
        </div>
      </div>

      <div className="p-8">
        <div className="mx-auto max-w-xl">
          {/* Swap-style Deposit Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-black p-1">
            <div className="rounded-[22px] bg-black/60 p-6 backdrop-blur-xl">
              {activeBanks.length ? (
                <form action={createDepositRequestAction} className="space-y-6">
                  {/* You Pay Section */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-400">You deposit</span>
                      <span className="text-xs text-zinc-500">Balance: —</span>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <input
                        name="amountTzs"
                        type="number"
                        min={1}
                        step={1}
                        required
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-4xl font-bold text-white outline-none placeholder:text-zinc-700"
                      />
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20">
                          <span className="text-sm font-bold text-amber-400">T</span>
                        </div>
                        <span className="font-semibold text-white">TZS</span>
                      </div>
                    </div>
                  </div>

                  {/* Swap Arrow */}
                  <div className="flex justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900">
                      <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                      </svg>
                    </div>
                  </div>

                  {/* You Receive Section */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-400">You receive</span>
                      <span className="text-xs text-emerald-400">1:1 rate</span>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1 text-4xl font-bold text-zinc-500">
                        Same amount
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-violet-500/20 px-4 py-2">
                        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full">
                          <img src="/ntzs-logo.png" alt="nTZS" className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-violet-300">nTZS</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-400">Payment Method</label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        className="flex flex-col items-center gap-2 rounded-xl border-2 border-violet-500 bg-violet-500/10 p-4 transition-all"
                      >
                        <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                        <span className="text-xs font-medium text-white">Bank Transfer</span>
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 opacity-50"
                      >
                        <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                        <span className="text-xs font-medium text-zinc-500">M-Pesa</span>
                        <span className="text-[10px] text-zinc-600">Coming soon</span>
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 opacity-50"
                      >
                        <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                        <span className="text-xs font-medium text-zinc-500">Selcom</span>
                        <span className="text-[10px] text-zinc-600">Coming soon</span>
                      </button>
                    </div>
                  </div>

                  {/* Bank Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-400">Settlement Bank</label>
                    <select
                      name="bankId"
                      required
                      defaultValue={activeBanks[0]?.id}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-500/50"
                    >
                      {activeBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 py-4 text-center text-lg font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02]"
                  >
                    Create Deposit Request
                  </button>

                  {/* Info */}
                  <div className="rounded-xl bg-blue-500/10 p-4">
                    <div className="flex gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                      <div className="text-sm text-blue-300">
                        <p className="font-medium">How it works</p>
                        <p className="mt-1 text-blue-400/80">
                          After creating a request, you'll receive bank details to complete your transfer. Once confirmed, nTZS will be minted to your wallet.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="mt-4 text-zinc-400">No settlement bank is configured yet.</p>
                  <p className="mt-1 text-sm text-zinc-600">Please contact support.</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-white">Secure</p>
              <p className="mt-1 text-xs text-zinc-500">Bank-level security</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-white">Fast</p>
              <p className="mt-1 text-xs text-zinc-500">Same-day processing</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-white">1:1 Rate</p>
              <p className="mt-1 text-xs text-zinc-500">No hidden fees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
