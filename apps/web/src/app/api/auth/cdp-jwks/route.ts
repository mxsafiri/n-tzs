import { NextResponse } from 'next/server'
import { getPublicJWKS } from '@/lib/cdp-jwt'

export async function GET() {
  try {
    const jwks = await getPublicJWKS()
    
    return NextResponse.json(jwks, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
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
