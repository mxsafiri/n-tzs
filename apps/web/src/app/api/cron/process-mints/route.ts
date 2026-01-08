import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { getDb } from '@/lib/db'
import { depositRequests, mintTransactions, dailyIssuance, wallets, auditLogs } from '@ntzs/db'
import { eq, and, sql } from 'drizzle-orm'

const CRON_SECRET = process.env.CRON_SECRET || ''
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || ''
const NTZS_CONTRACT_ADDRESS = process.env.NTZS_CONTRACT_ADDRESS_BASE_SEPOLIA || process.env.NTZS_CONTRACT_ADDRESS_BASE || ''
const DAILY_ISSUANCE_CAP_TZS = Number(process.env.DAILY_ISSUANCE_CAP_TZS ?? '100000000')

const NTZS_ABI = [
  'function mint(address to, uint256 amount)',
  'function MINTER_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
] as const

export const maxDuration = 60

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!MINTER_PRIVATE_KEY) {
    return NextResponse.json({ error: 'MINTER_PRIVATE_KEY not configured' }, { status: 500 })
  }

  if (!NTZS_CONTRACT_ADDRESS) {
    return NextResponse.json({ error: 'Contract address not configured' }, { status: 500 })
  }

  const { db } = getDb()

  // Claim a mint job (atomically select and update to processing)
  const [job] = await db
    .update(depositRequests)
    .set({ status: 'mint_processing', updatedAt: new Date() })
    .where(
      eq(
        depositRequests.id,
        sql`(
          SELECT id FROM ${depositRequests}
          WHERE status = 'mint_pending' AND chain = 'base'
          ORDER BY created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )`
      )
    )
    .returning({
      id: depositRequests.id,
      walletId: depositRequests.walletId,
      amountTzs: depositRequests.amountTzs,
      chain: depositRequests.chain,
    })

  if (!job) {
    return NextResponse.json({ status: 'no_pending_jobs' })
  }

  // Create mint transaction record
  await db
    .insert(mintTransactions)
    .values({
      depositRequestId: job.id,
      chain: job.chain,
      contractAddress: NTZS_CONTRACT_ADDRESS,
      status: 'processing',
    })
    .onConflictDoUpdate({
      target: mintTransactions.depositRequestId,
      set: { status: 'processing', contractAddress: NTZS_CONTRACT_ADDRESS, updatedAt: new Date() },
    })

  // Check daily issuance cap
  const today = getTodayUTC()
  await db
    .insert(dailyIssuance)
    .values({ day: today, capTzs: DAILY_ISSUANCE_CAP_TZS, reservedTzs: 0, issuedTzs: 0 })
    .onConflictDoNothing()

  const [dailyRow] = await db
    .select({ reservedTzs: dailyIssuance.reservedTzs, issuedTzs: dailyIssuance.issuedTzs, capTzs: dailyIssuance.capTzs })
    .from(dailyIssuance)
    .where(eq(dailyIssuance.day, today))
    .limit(1)

  if (dailyRow && (dailyRow.reservedTzs + dailyRow.issuedTzs + job.amountTzs) > dailyRow.capTzs) {
    // Release job - daily cap reached
    await db.update(depositRequests).set({ status: 'mint_pending', updatedAt: new Date() }).where(eq(depositRequests.id, job.id))
    await db.update(mintTransactions).set({ status: 'cap_exceeded', error: 'Daily issuance cap reached', updatedAt: new Date() }).where(eq(mintTransactions.depositRequestId, job.id))
    return NextResponse.json({ status: 'cap_exceeded', depositId: job.id })
  }

  // Reserve the amount
  await db
    .update(dailyIssuance)
    .set({ reservedTzs: sql`${dailyIssuance.reservedTzs} + ${job.amountTzs}`, updatedAt: new Date() })
    .where(eq(dailyIssuance.day, today))

  try {
    // Get wallet address
    const [wallet] = await db
      .select({ address: wallets.address })
      .from(wallets)
      .where(eq(wallets.id, job.walletId))
      .limit(1)

    if (!wallet?.address) {
      throw new Error('Wallet address not found')
    }

    // Execute mint transaction
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL)
    const signer = new ethers.Wallet(MINTER_PRIVATE_KEY, provider)
    const token = new ethers.Contract(NTZS_CONTRACT_ADDRESS, NTZS_ABI, signer)

    // Verify minter role
    const minterRole: string = await token.MINTER_ROLE()
    const hasMinter: boolean = await token.hasRole(minterRole, await signer.getAddress())
    if (!hasMinter) {
      throw new Error('Minter key does not have MINTER_ROLE')
    }

    const amountWei = BigInt(String(job.amountTzs)) * BigInt(10) ** BigInt(18)
    const tx = await token.mint(wallet.address, amountWei)

    // Update with tx hash
    await db
      .update(mintTransactions)
      .set({ txHash: tx.hash, status: 'submitted', updatedAt: new Date() })
      .where(eq(mintTransactions.depositRequestId, job.id))

    // Wait for confirmation
    await tx.wait(1)

    // Commit issuance
    await db
      .update(dailyIssuance)
      .set({
        issuedTzs: sql`${dailyIssuance.issuedTzs} + ${job.amountTzs}`,
        reservedTzs: sql`${dailyIssuance.reservedTzs} - ${job.amountTzs}`,
        updatedAt: new Date(),
      })
      .where(eq(dailyIssuance.day, today))

    // Mark as minted
    await db.update(mintTransactions).set({ status: 'minted', updatedAt: new Date() }).where(eq(mintTransactions.depositRequestId, job.id))
    await db.update(depositRequests).set({ status: 'minted', updatedAt: new Date() }).where(eq(depositRequests.id, job.id))

    // Audit log
    await db.insert(auditLogs).values({
      action: 'mint_completed',
      entityType: 'deposit_request',
      entityId: job.id,
      metadata: { amountTzs: job.amountTzs, walletAddress: wallet.address, txHash: tx.hash, chain: job.chain },
    })

    console.log(`[cron/process-mints] Minted deposit ${job.id}`, { txHash: tx.hash, amountTzs: job.amountTzs })

    return NextResponse.json({
      status: 'minted',
      depositId: job.id,
      txHash: tx.hash,
      amountTzs: job.amountTzs,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    // Release reservation
    await db
      .update(dailyIssuance)
      .set({ reservedTzs: sql`GREATEST(0, ${dailyIssuance.reservedTzs} - ${job.amountTzs})`, updatedAt: new Date() })
      .where(eq(dailyIssuance.day, today))

    // Mark as failed
    await db.update(mintTransactions).set({ status: 'failed', error: errorMessage, updatedAt: new Date() }).where(eq(mintTransactions.depositRequestId, job.id))
    await db.update(depositRequests).set({ status: 'mint_failed', updatedAt: new Date() }).where(eq(depositRequests.id, job.id))

    // Audit log
    await db.insert(auditLogs).values({
      action: 'mint_failed',
      entityType: 'deposit_request',
      entityId: job.id,
      metadata: { amountTzs: job.amountTzs, error: errorMessage, chain: job.chain },
    })

    console.error(`[cron/process-mints] Failed to mint ${job.id}:`, errorMessage)

    return NextResponse.json({ status: 'failed', depositId: job.id, error: errorMessage }, { status: 500 })
  }
}
