import { desc, eq, sql, gte, and } from 'drizzle-orm'
import { ethers } from 'ethers'
import Link from 'next/link'

import { requireAnyRole } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import {
  users,
  depositRequests,
  mintTransactions,
  kycCases,
  dailyIssuance,
  auditLogs,
  wallets,
} from '@ntzs/db'
import { ExportReportButton } from './_components/ExportReportButton'

const CONTRACT_ADDRESS = process.env.NTZS_CONTRACT_ADDRESS_BASE_SEPOLIA || ''
const RPC_URL = 'https://sepolia.base.org'

async function getOnChainTotalSupply(): Promise<string> {
  if (!CONTRACT_ADDRESS) return '0'
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ['function totalSupply() view returns (uint256)'],
      provider
    )
    const supply = await contract.totalSupply()
    return ethers.formatUnits(supply, 18)
  } catch {
    return '0'
  }
}

function getDateDaysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function OversightDashboard() {
  await requireAnyRole(['platform_compliance', 'super_admin'])

  const { db } = getDb()

  // Get aggregate stats
  const [stats] = await db
    .select({
      totalUsers: sql<number>`count(distinct ${users.id})`.mapWith(Number),
      totalDeposits: sql<number>`count(${depositRequests.id})`.mapWith(Number),
      totalMinted: sql<number>`coalesce(sum(case when ${depositRequests.status} = 'minted' then ${depositRequests.amountTzs} else 0 end), 0)`.mapWith(Number),
      totalPending: sql<number>`coalesce(sum(case when ${depositRequests.status} in ('submitted', 'mint_pending', 'mint_processing') then ${depositRequests.amountTzs} else 0 end), 0)`.mapWith(Number),
    })
    .from(depositRequests)
    .leftJoin(users, eq(users.id, depositRequests.userId))

  // KYC stats
  const [kycStats] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      approved: sql<number>`count(*) filter (where ${kycCases.status} = 'approved')`.mapWith(Number),
      pending: sql<number>`count(*) filter (where ${kycCases.status} = 'pending')`.mapWith(Number),
      rejected: sql<number>`count(*) filter (where ${kycCases.status} = 'rejected')`.mapWith(Number),
    })
    .from(kycCases)

  // Today's issuance
  const today = new Date().toISOString().slice(0, 10)
  const [todayIssuance] = await db
    .select()
    .from(dailyIssuance)
    .where(eq(dailyIssuance.day, today))
    .limit(1)

  // Recent deposits with full details
  const recentDeposits = await db
    .select({
      id: depositRequests.id,
      amountTzs: depositRequests.amountTzs,
      status: depositRequests.status,
      paymentProvider: depositRequests.paymentProvider,
      pspReference: depositRequests.pspReference,
      createdAt: depositRequests.createdAt,
      userEmail: users.email,
      txHash: mintTransactions.txHash,
    })
    .from(depositRequests)
    .leftJoin(users, eq(users.id, depositRequests.userId))
    .leftJoin(mintTransactions, eq(mintTransactions.depositRequestId, depositRequests.id))
    .orderBy(desc(depositRequests.createdAt))
    .limit(20)

  // Recent audit logs
  const recentAuditLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(15)

  // Deposit status breakdown
  const statusBreakdown = await db
    .select({
      status: depositRequests.status,
      count: sql<number>`count(*)`.mapWith(Number),
      total: sql<number>`coalesce(sum(${depositRequests.amountTzs}), 0)`.mapWith(Number),
    })
    .from(depositRequests)
    .groupBy(depositRequests.status)

  // On-chain total supply
  const onChainSupply = await getOnChainTotalSupply()

  // User count
  const [userCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(users)

  // Wallet count
  const [walletCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(wallets)

  // 7-day issuance stats
  const sevenDaysAgo = getDateDaysAgo(7)
  const [sevenDayStats] = await db
    .select({
      minted: sql<number>`coalesce(sum(case when ${depositRequests.status} = 'minted' then ${depositRequests.amountTzs} else 0 end), 0)`.mapWith(Number),
    })
    .from(depositRequests)
    .where(gte(depositRequests.createdAt, sevenDaysAgo))

  // 30-day issuance stats
  const thirtyDaysAgo = getDateDaysAgo(30)
  const [thirtyDayStats] = await db
    .select({
      minted: sql<number>`coalesce(sum(case when ${depositRequests.status} = 'minted' then ${depositRequests.amountTzs} else 0 end), 0)`.mapWith(Number),
    })
    .from(depositRequests)
    .where(gte(depositRequests.createdAt, thirtyDaysAgo))

  const formatNumber = (n: number) => n.toLocaleString()
  const formatDate = (d: Date) => new Date(d).toLocaleString()
  const formatCompact = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const statusColors: Record<string, string> = {
    minted: 'bg-emerald-500/20 text-emerald-300',
    submitted: 'bg-blue-500/20 text-blue-300',
    mint_pending: 'bg-amber-500/20 text-amber-300',
    mint_processing: 'bg-violet-500/20 text-violet-300',
    mint_failed: 'bg-red-500/20 text-red-300',
    rejected: 'bg-red-500/20 text-red-300',
  }

  return (
    <main className="space-y-8 p-6">
      {/* Hero Section */}
      <section id="overview" className="scroll-mt-6">
        <div className="rounded-3xl bg-gradient-to-br from-violet-950/50 via-violet-900/30 to-transparent p-8 ring-1 ring-white/10">
          <div className="flex items-start justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Transparency & Stability
              </h1>
              <p className="mt-4 text-xl text-violet-200">
                nTZS is always redeemable 1:1 for Tanzanian Shillings. Always.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                nTZS is fully backed by Tanzanian Shilling reserves held in regulated financial 
                institutions. As part of our commitment to transparency, we provide real-time 
                verification of all reserve assets and on-chain token supply.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExportReportButton />
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 ring-1 ring-emerald-500/20">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Balances & Issuance - Circle-inspired layout */}
      <section id="reserves" className="scroll-mt-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Balances Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-slate-900">
            <h2 className="text-lg font-semibold text-slate-700">Balances</h2>
            <div className="mt-6 grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-slate-500">In circulation</p>
                <p className="mt-1 text-3xl font-bold text-violet-600">
                  {formatCompact(parseFloat(onChainSupply))}
                </p>
                <p className="mt-1 text-xs text-slate-400">nTZS tokens</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Reserves</p>
                <p className="mt-1 text-3xl font-bold text-violet-600">
                  {formatCompact(stats?.totalMinted || 0)}
                </p>
                <p className="mt-1 text-xs text-slate-400">TZS backing</p>
              </div>
            </div>
            
            {/* Reserve Bar */}
            <div className="mt-8">
              <div className="flex h-40 items-end gap-1">
                <div className="relative flex-1">
                  <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-violet-600" style={{ height: '100%' }} />
                  <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-violet-400" style={{ height: '85%' }} />
                  <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-violet-300" style={{ height: '60%' }} />
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">Reserves</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-300" />
                <span className="text-slate-600">Mobile Money Deposits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-400" />
                <span className="text-slate-600">Bank Deposits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-600" />
                <span className="text-slate-600">Operating Reserves</span>
              </div>
            </div>
          </div>

          {/* Issuance & Redemption Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-slate-900">
            <h2 className="text-lg font-semibold text-slate-700">Issuance & Activity</h2>
            
            <div className="mt-6 space-y-6">
              {/* 7 Day Change */}
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-semibold text-slate-700">7 Day Change</h3>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Issued</p>
                    <p className="text-xl font-bold text-slate-800">{formatCompact(sevenDayStats?.minted || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Redeemed</p>
                    <p className="text-xl font-bold text-slate-800">0</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net change</p>
                    <p className="text-sm font-medium text-emerald-600">
                      +{formatCompact(sevenDayStats?.minted || 0)} in circulation
                    </p>
                  </div>
                </div>
              </div>

              {/* 30 Day Change */}
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-semibold text-slate-700">30 Day Change</h3>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Issued</p>
                    <p className="text-xl font-bold text-slate-800">{formatCompact(thirtyDayStats?.minted || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Redeemed</p>
                    <p className="text-xl font-bold text-slate-800">0</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net change</p>
                    <p className="text-sm font-medium text-emerald-600">
                      +{formatCompact(thirtyDayStats?.minted || 0)} in circulation
                    </p>
                  </div>
                </div>
              </div>

              {/* Today */}
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-semibold text-slate-700">Today</h3>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Issued</p>
                    <p className="text-xl font-bold text-slate-800">{formatCompact(todayIssuance?.issuedTzs || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cap</p>
                    <p className="text-xl font-bold text-slate-800">{formatCompact(todayIssuance?.capTzs || 100000000)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Utilization</p>
                    <p className="text-sm font-medium text-violet-600">
                      {(((todayIssuance?.issuedTzs || 0) / (todayIssuance?.capTzs || 100000000)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stability Section */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <h2 className="text-xl font-semibold text-white">Stability you can trust</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
          nTZS reserves are held separately from operating funds at regulated financial 
          institutions in Tanzania. Our commitment to transparency includes real-time 
          on-chain verification, daily reconciliation, and comprehensive audit trails 
          for every transaction.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">1:1 Reserve Backing</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Every nTZS token is backed by an equivalent amount of Tanzanian Shillings held in reserve.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
              <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">Real-time Transparency</h3>
            <p className="mt-2 text-sm text-zinc-400">
              On-chain supply and reserve balances are verified in real-time and publicly accessible.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">Complete Audit Trail</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Every mint, transfer, and redemption is logged with full traceability for compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section id="issuance" className="scroll-mt-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Users</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatNumber(userCount?.count || 0)}</p>
            <p className="mt-1 text-xs text-zinc-500">Verified accounts</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Connected Wallets</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatNumber(walletCount?.count || 0)}</p>
            <p className="mt-1 text-xs text-zinc-500">Linked addresses</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Deposits</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatNumber(stats?.totalDeposits || 0)}</p>
            <p className="mt-1 text-xs text-zinc-500">Processed requests</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">KYC Verified</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatNumber(kycStats?.approved || 0)}</p>
            <p className="mt-1 text-xs text-zinc-500">Approved users</p>
          </div>
        </div>
      </section>

      {/* Two Column Layout for KYC and Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* KYC/AML Overview */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">KYC/AML Compliance</h2>
          <p className="mt-1 text-sm text-zinc-400">User verification breakdown</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-sm text-zinc-300">Verified & Approved</span>
              </div>
              <span className="font-semibold text-white">{kycStats?.approved || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-500/10 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                  <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-zinc-300">Pending Review</span>
              </div>
              <span className="font-semibold text-white">{kycStats?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-500/10 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-sm text-zinc-300">Rejected</span>
              </div>
              <span className="font-semibold text-white">{kycStats?.rejected || 0}</span>
            </div>
          </div>
        </div>

        {/* Deposit Pipeline */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Deposit Pipeline</h2>
          <p className="mt-1 text-sm text-zinc-400">Current status distribution</p>
          <div className="mt-4 space-y-2">
            {statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between rounded-lg bg-black/20 p-3">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${statusColors[s.status] || 'bg-zinc-500/20 text-zinc-300'}`}>
                  {s.status.replace('_', ' ')}
                </span>
                <div className="text-right">
                  <span className="font-semibold text-white">{s.count}</span>
                  <span className="ml-2 text-xs text-zinc-500">({formatNumber(s.total)} TZS)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Deposits Table */}
      <section id="deposits" className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Deposit Activity</h2>
            <p className="mt-1 text-sm text-zinc-400">Last 20 deposit requests</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Provider</th>
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">TX Hash</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentDeposits.map((dep) => (
                <tr key={dep.id} className="text-sm">
                  <td className="py-3 pr-4">
                    <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-zinc-400">
                      {dep.id.slice(0, 8)}
                    </code>
                  </td>
                  <td className="py-3 pr-4 text-zinc-300">{dep.userEmail || '—'}</td>
                  <td className="py-3 pr-4 font-medium text-white">{formatNumber(dep.amountTzs)}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      dep.paymentProvider === 'zenopay' ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-500/20 text-zinc-300'
                    }`}>
                      {dep.paymentProvider || 'bank'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {dep.pspReference ? (
                      <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
                        {dep.pspReference}
                      </code>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${statusColors[dep.status] || 'bg-zinc-500/20 text-zinc-300'}`}>
                      {dep.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {dep.txHash ? (
                      <a
                        href={`https://sepolia.basescan.org/tx/${dep.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400 hover:bg-blue-500/20"
                      >
                        {dep.txHash.slice(0, 10)}...
                      </a>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-3 text-xs text-zinc-500">{formatDate(dep.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Trail */}
      <section id="audit" className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Audit Trail</h2>
            <p className="mt-1 text-sm text-zinc-400">System activity log for compliance review</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {recentAuditLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">No audit logs yet</p>
          ) : (
            recentAuditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 rounded-xl bg-black/20 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                  {log.action === 'mint_completed' && <span className="text-emerald-400">✓</span>}
                  {log.action === 'mint_failed' && <span className="text-red-400">✗</span>}
                  {log.action === 'kyc_approved' && <span className="text-blue-400">👤</span>}
                  {!['mint_completed', 'mint_failed', 'kyc_approved'].includes(log.action) && (
                    <span className="text-zinc-400">📝</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{log.action}</span>
                    {log.entityType && (
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                        {log.entityType}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {log.entityId && (
                      <code className="mr-2 rounded bg-black/30 px-1 py-0.5 font-mono text-xs">
                        {log.entityId.slice(0, 8)}...
                      </code>
                    )}
                    {log.actorEmail && <span>by {log.actorEmail}</span>}
                  </p>
                  {log.metadata ? (
                    <pre className="mt-2 max-h-20 overflow-auto rounded bg-black/30 p-2 text-xs text-zinc-500">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
                <div className="text-xs text-zinc-600">{formatDate(log.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Contract Info */}
      <section id="contract" className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Smart Contract Details</h2>
        <p className="mt-1 text-sm text-zinc-400">On-chain verification links</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Contract Address</p>
            <a
              href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block font-mono text-sm text-blue-400 hover:text-blue-300"
            >
              {CONTRACT_ADDRESS || 'Not configured'}
            </a>
            <p className="mt-1 text-xs text-zinc-500">Base Sepolia Network</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Block Explorer</p>
            <a
              href={`https://sepolia.basescan.org/token/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-blue-400 hover:text-blue-300"
            >
              View Token on BaseScan →
            </a>
            <p className="mt-1 text-xs text-zinc-500">Verify all transactions publicly</p>
          </div>
        </div>
      </section>
    </main>
  )
}

