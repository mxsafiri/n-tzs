import { NextResponse } from 'next/server'
import { getPublicJWKS } from '../../../lib/cdp-jwt'

// Standard .well-known JWKS endpoint
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const jwks = await getPublicJWKS()
    
    return NextResponse.json(jwks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  } catch (error) {
    console.error('[JWKS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate JWKS' },
      { status: 500 }
    )
  }
}

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
