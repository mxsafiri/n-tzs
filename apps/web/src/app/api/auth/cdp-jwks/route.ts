import { NextResponse } from 'next/server'
import { getPublicJWKS } from '@/lib/cdp-jwt'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const jwks = await getPublicJWKS()
    
    console.log('[CDP-JWKS] Returning JWKS:', JSON.stringify(jwks))
    
    return NextResponse.json(jwks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  } catch (error) {
    console.error('[CDP-JWKS] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate JWKS',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
