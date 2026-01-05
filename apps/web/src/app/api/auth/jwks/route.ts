import { NextResponse } from 'next/server'

const NEON_AUTH_URL = process.env.NEON_AUTH_URL || process.env.NEON_AUTH_BASE_URL

export async function GET() {
  if (!NEON_AUTH_URL) {
    return NextResponse.json(
      { error: 'NEON_AUTH_URL not configured' },
      { status: 500 }
    )
  }

  try {
    // Try multiple possible JWKS paths
    const jwksPaths = [
      '/.well-known/jwks.json',
      '/jwks',
      '/api/auth/jwks',
      '/.well-known/openid-configuration',
    ]

    for (const path of jwksPaths) {
      try {
        const url = `${NEON_AUTH_URL}${path}`
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (response.ok) {
          const data = await response.json()
          
          // If it's an openid-configuration, extract the jwks_uri
          if (data.jwks_uri) {
            const jwksResponse = await fetch(data.jwks_uri)
            if (jwksResponse.ok) {
              const jwks = await jwksResponse.json()
              return NextResponse.json(jwks, {
                headers: {
                  'Cache-Control': 'public, max-age=3600',
                  'Access-Control-Allow-Origin': '*',
                },
              })
            }
          }

          // If it has keys, it's a JWKS
          if (data.keys) {
            return NextResponse.json(data, {
              headers: {
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
              },
            })
          }
        }
      } catch {
        // Try next path
        continue
      }
    }

    // If no JWKS found, return error with debug info
    return NextResponse.json(
      { 
        error: 'JWKS not found at Neon Auth endpoint',
        neonAuthUrl: NEON_AUTH_URL,
        triedPaths: jwksPaths,
      },
      { status: 404 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch JWKS',
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
