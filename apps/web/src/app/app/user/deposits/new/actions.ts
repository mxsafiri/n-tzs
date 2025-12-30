'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireDbUser, requireRole } from '@/lib/auth/rbac'
import { getDb } from '@/lib/db'
import { depositRequests, kycCases, wallets } from '@ntzs/db'

export async function createDepositRequestAction(formData: FormData) {
  await requireRole('end_user')
  const dbUser = await requireDbUser()

  const bankId = String(formData.get('bankId') ?? '').trim()
  const amountTzsRaw = String(formData.get('amountTzs') ?? '').trim()

  if (!bankId) {
    throw new Error('Missing bank')
  }

  const amountTzs = Number(amountTzsRaw)
  if (!Number.isFinite(amountTzs) || amountTzs <= 0) {
    throw new Error('Invalid amount')
  }

  const { db } = getDb()

  const wallet = await db.query.wallets.findFirst({
    where: and(eq(wallets.userId, dbUser.id), eq(wallets.chain, 'base')),
  })

  if (!wallet) {
    redirect('/app/user/wallet')
  }

  const latestKyc = await db
    .select({ status: kycCases.status })
    .from(kycCases)
    .where(eq(kycCases.userId, dbUser.id))
    .orderBy(kycCases.createdAt)
    .limit(1)

  const kycStatus = latestKyc[0]?.status ?? null

  if (kycStatus !== 'approved') {
    redirect('/app/user/kyc')
  }

  const idempotencyKey = crypto.randomUUID()

  await db.insert(depositRequests).values({
    userId: dbUser.id,
    bankId,
    walletId: wallet.id,
    chain: wallet.chain,
    amountTzs: Math.trunc(amountTzs),
    idempotencyKey,
    status: 'submitted',
  })

  revalidatePath('/app/user')
  revalidatePath('/app/user/activity')

  redirect('/app/user/activity')
}
