import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signCDPToken } from '@/lib/cdp-jwt'

// Get the app's base URL for issuer/audience
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  return 'http://localhost:3000'
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    // Get Neon Auth session from cookies
    // The session cookie name may vary - check for common patterns
    const sessionCookie = 
      cookieStore.get('better-auth.session_token') ||
      cookieStore.get('__session') ||
      cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session found. Please log in first.' },
        { status: 401 }
      )
    }

    // Fetch user info from Neon Auth session endpoint
    const neonAuthUrl = process.env.NEON_AUTH_URL || process.env.NEON_AUTH_BASE_URL
    if (!neonAuthUrl) {
      return NextResponse.json(
        { error: 'NEON_AUTH_URL not configured' },
        { status: 500 }
      )
    }

    // Get session info from Neon Auth
    const sessionResponse = await fetch(`${neonAuthUrl}/api/auth/get-session`, {
      headers: {
        Cookie: `better-auth.session_token=${sessionCookie.value}`,
      },
    })

    if (!sessionResponse.ok) {
      // Try alternative session endpoint
      const altSessionResponse = await fetch(`${neonAuthUrl}/get-session`, {
        headers: {
          Cookie: `better-auth.session_token=${sessionCookie.value}`,
        },
      })
      
      if (!altSessionResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to validate session with Neon Auth' },
          { status: 401 }
        )
      }
      
      const session = await altSessionResponse.json()
      return await issueToken(session)
    }

    const session = await sessionResponse.json()
    return await issueToken(session)
  } catch (error) {
    console.error('[CDP-Token] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate CDP token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function issueToken(session: { user?: { id?: string; email?: string; name?: string }; session?: { userId?: string } }) {
  const userId = session.user?.id || session.session?.userId
  
  if (!userId) {
    return NextResponse.json(
      { error: 'No user ID in session' },
      { status: 401 }
    )
  }

  const baseUrl = getBaseUrl()
  
  // Sign a new JWT with ES256 for CDP
  const token = await signCDPToken(
    {
      sub: userId,
      email: session.user?.email,
      name: session.user?.name,
    },
    baseUrl, // issuer
    baseUrl  // audience
  )

  return NextResponse.json({ token })
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
