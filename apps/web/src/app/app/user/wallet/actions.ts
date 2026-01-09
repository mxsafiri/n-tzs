'use server'

import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { requireDbUser, requireAnyRole } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { wallets } from '@ntzs/db'

export async function saveEmbeddedWalletAction(formData: FormData) {
  await requireAnyRole(['end_user', 'super_admin'])
  const dbUser = await requireDbUser()

  const address = String(formData.get('address') ?? '').trim()

  if (!address) {
    throw new Error('Missing wallet address')
  }

  const { db } = getDb()

  const existing = await db.query.wallets.findFirst({
    where: and(eq(wallets.userId, dbUser.id), eq(wallets.chain, 'base')),
  })

  if (existing) {
    if (existing.address.toLowerCase() !== address.toLowerCase()) {
      await db
        .update(wallets)
        .set({
          address,
          provider: 'coinbase_embedded',
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, existing.id))

      revalidatePath('/app/user')
      revalidatePath('/app/user/wallet')
    }

    return
  }

  await db.insert(wallets).values({
    userId: dbUser.id,
    chain: 'base',
    address,
    provider: 'coinbase_embedded',
  })

  revalidatePath('/app/user')
  revalidatePath('/app/user/wallet')
}
