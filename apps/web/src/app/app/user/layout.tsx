import type { ReactNode } from 'react'
import Link from 'next/link'
import { eq } from 'drizzle-orm'

import { requireDbUser, requireRole } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { wallets } from '@ntzs/db'

// Icons
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  )
}

function DepositIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}

function UserGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

const navItems = [
  { href: '/app/user', label: 'Dashboard', icon: DashboardIcon },
  { href: '/app/user/wallet', label: 'Wallet', icon: WalletIcon },
  { href: '/app/user/deposits/new', label: 'Deposit', icon: DepositIcon },
  { href: '/app/user/activity', label: 'Activity', icon: ActivityIcon },
]

const rewardItems = [
  { href: '/app/user/stake', label: 'Stake to Earn', icon: SparklesIcon, badge: 'NEW' },
  { href: '/app/user/invite', label: 'Invite & Earn', icon: UserGroupIcon },
]

export default async function UserLayout({ children }: { children: ReactNode }) {
  await requireRole('end_user')
  const dbUser = await requireDbUser()
  const { db } = getDb()

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, dbUser.id),
  })

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-black/70 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <Link href="/app/user" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
              <img src="/ntzs-logo.png" alt="nTZS" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <p className="font-semibold text-white">nTZS</p>
              <p className="text-xs text-zinc-500">Digital Wallet</p>
            </div>
          </Link>
        </div>

        {/* Sidebar meta */}
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              {dbUser.role.replace('_', ' ')}
            </span>
            <Link
              href="/account/settings"
              className="text-xs font-medium text-zinc-300 hover:text-white"
            >
              Account
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 pb-28">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Menu</p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>

          <p className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Rewards</p>
          <div className="space-y-1">
            {rewardItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Wallet Status */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${wallet ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <div>
                <p className="text-sm font-medium text-white">{wallet ? 'Wallet Active' : 'Setup Required'}</p>
                <p className="text-xs text-zinc-500">
                  {wallet ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : 'Create your wallet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64">
        {children}
      </main>
    </div>
  )
}
