import Link from 'next/link'
import { requireRole, requireDbUser } from '@/lib/auth/rbac'

export default async function InvitePage() {
  await requireRole('end_user')
  const dbUser = await requireDbUser()

  // Generate a simple referral code based on user ID
  const referralCode = `NTZS-${dbUser.id.slice(0, 8).toUpperCase()}`

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
          <h1 className="text-2xl font-bold text-white">Invite & Earn</h1>
          <p className="mt-1 text-sm text-zinc-400">Share nTZS with friends and earn rewards together</p>
        </div>
      </div>

      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          {/* Reward Banner */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/50 via-black to-teal-950/30 p-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div className="mt-4 sm:ml-6 sm:mt-0">
                <h2 className="text-2xl font-bold text-white">Earn 5,000 TZS</h2>
                <p className="mt-2 text-zinc-400">
                  For every friend who signs up and makes their first deposit using your referral code
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="mt-1 text-xs text-zinc-500">Friends Invited</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">0 TZS</div>
                <div className="mt-1 text-xs text-zinc-500">Total Earned</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-violet-400">0</div>
                <div className="mt-1 text-xs text-zinc-500">Pending Rewards</div>
              </div>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
            <h3 className="font-semibold text-white">Your Referral Code</h3>
            <p className="mt-1 text-sm text-zinc-500">Share this code with friends to earn rewards</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-dashed border-violet-500/50 bg-violet-500/10 px-6 py-4">
                <code className="text-xl font-bold tracking-wider text-violet-300">{referralCode}</code>
              </div>
              <button className="rounded-xl bg-violet-500 p-4 text-white transition-colors hover:bg-violet-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              </button>
            </div>

            {/* Share Buttons */}
            <div className="mt-6">
              <p className="text-sm text-zinc-500">Share via</p>
              <div className="mt-3 flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1DA1F2]/10 px-4 py-3 text-sm font-medium text-[#1DA1F2] transition-colors hover:bg-[#1DA1F2]/20">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6">
            <h3 className="font-semibold text-white">How It Works</h3>
            <div className="mt-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">Share Your Code</p>
                  <p className="mt-1 text-sm text-zinc-500">Send your unique referral code to friends and family</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">They Sign Up</p>
                  <p className="mt-1 text-sm text-zinc-500">Your friend creates an account using your code</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">Both Earn Rewards</p>
                  <p className="mt-1 text-sm text-zinc-500">When they make their first deposit, you both get 5,000 TZS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-zinc-600">
            Referral rewards are subject to our{' '}
            <Link href="/terms" className="text-violet-400 hover:underline">terms and conditions</Link>.
            Rewards are credited after successful KYC verification and first deposit.
          </p>
        </div>
      </div>
    </div>
  )
}
