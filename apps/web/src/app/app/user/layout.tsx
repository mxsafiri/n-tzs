import type { ReactNode } from 'react'
import { eq } from 'drizzle-orm'

import { requireDbUser, requireRole } from '@/lib/auth/rbac'
import { UserTopBar } from '@/app/app/_components/UserTopBar'
import { getDb } from '@/lib/db'
import { wallets } from '@ntzs/db'

import { MobileSidebar } from './_components/MobileSidebar'

export default async function UserLayout({ children }: { children: ReactNode }) {
  await requireRole('end_user')
  const dbUser = await requireDbUser()
  const { db } = getDb()

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, dbUser.id),
  })

  return (
    <div className="flex min-h-screen">
      {/* Collapsible Sidebar */}
      <MobileSidebar wallet={wallet ?? null} />

      {/* Main Content - responsive padding */}
      <main className="flex-1 pl-0 lg:pl-64">
        <UserTopBar />
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
