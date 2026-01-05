import { NextResponse } from 'next/server'

// OIDC Discovery endpoint for automatic JWKS discovery
export const dynamic = 'force-dynamic'

function getBaseUrl() {
  if (process.env.VERCEL) {
    return 'https://ntzs.vercel.app'
  }
  return 'http://localhost:3000'
}

export async function GET() {
  const baseUrl = getBaseUrl()
  
  const config = {
    issuer: baseUrl,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    authorization_endpoint: `${baseUrl}/api/auth`,
    token_endpoint: `${baseUrl}/api/auth/cdp-token`,
    response_types_supported: ['token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['ES256'],
    scopes_supported: ['openid'],
  }

  return NextResponse.json(config, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
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
