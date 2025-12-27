import { AccountView } from '@neondatabase/neon-js/auth/react/ui'

export const dynamicParams = false

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>
}) {
  const { path } = await params

  const title = (() => {
    if (path === 'settings') return 'Account settings'
    if (path === 'security') return 'Security'
    if (path === 'sessions') return 'Sessions'
    return 'Account'
  })()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-medium text-white/60">Account</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

      <AccountView path={path} />
    </div>
  )
}
