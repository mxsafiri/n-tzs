import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { verifyZenoPayWebhook, type ZenoPayWebhookPayload } from '@/lib/psp/zenopay'
import { depositRequests } from '@ntzs/db'

const SAFE_MINT_THRESHOLD_TZS = 9000

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')

  if (!verifyZenoPayWebhook(apiKey)) {
    console.error('[ZenoPay Webhook] Invalid API key')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: ZenoPayWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { order_id, payment_status, reference, transid, channel } = payload

  if (!order_id || !payment_status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  console.log(`[ZenoPay Webhook] order_id=${order_id} status=${payment_status}`)

  if (payment_status !== 'COMPLETED') {
    return NextResponse.json({ status: 'acknowledged', payment_status })
  }

  const { db } = getDb()

  const [deposit] = await db
    .select()
    .from(depositRequests)
    .where(and(eq(depositRequests.id, order_id), eq(depositRequests.status, 'submitted')))
    .limit(1)

  if (!deposit) {
    console.warn(`[ZenoPay Webhook] Deposit not found or already processed: ${order_id}`)
    return NextResponse.json({ status: 'ignored', reason: 'not_found_or_processed' })
  }

  // Route to Safe approval if amount >= threshold
  const newStatus = deposit.amountTzs >= SAFE_MINT_THRESHOLD_TZS ? 'mint_requires_safe' : 'mint_pending'

  await db
    .update(depositRequests)
    .set({
      status: newStatus,
      pspReference: transid || reference,
      pspChannel: channel,
      fiatConfirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(depositRequests.id, order_id))

  console.log(`[ZenoPay Webhook] Deposit ${order_id} updated to ${newStatus}`)

  return NextResponse.json({ status: 'success', order_id })
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'zenopay-webhook' })
}
