import Link from 'next/link'
import { requireRole } from '@/lib/auth/rbac'

export default async function StakePage() {
  await requireRole('end_user')

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Stake to Earn</h1>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
              NEW
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">Earn passive income on your nTZS holdings</p>
        </div>
      </div>

      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          {/* Coming Soon Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-black to-purple-950/30 p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
              <svg className="h-10 w-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">Coming Soon</h2>
            <p className="mt-3 text-zinc-400">
              Stake your nTZS and earn up to 8% APY. Your stablecoin will work for you while maintaining full liquidity.
            </p>

            {/* Features Preview */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-emerald-400">8%</div>
                <div className="mt-1 text-xs text-zinc-500">Maximum APY</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-violet-400">Flexible</div>
                <div className="mt-1 text-xs text-zinc-500">Lock Periods</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-blue-400">Daily</div>
                <div className="mt-1 text-xs text-zinc-500">Reward Payouts</div>
              </div>
            </div>

            {/* Notify Form */}
            <div className="mt-8">
              <p className="text-sm text-zinc-500">Get notified when staking goes live</p>
              <div className="mt-3 flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/50"
                />
                <button className="rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-violet-600">
                  Notify Me
                </button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
            <h3 className="font-semibold text-white">How Staking Works</h3>
            <div className="mt-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-400">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">Deposit nTZS</p>
                  <p className="mt-1 text-sm text-zinc-500">Choose how much nTZS you want to stake</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-400">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">Select Duration</p>
                  <p className="mt-1 text-sm text-zinc-500">Longer lock periods earn higher rewards</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-400">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">Earn Rewards</p>
                  <p className="mt-1 text-sm text-zinc-500">Receive daily payouts directly to your wallet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
