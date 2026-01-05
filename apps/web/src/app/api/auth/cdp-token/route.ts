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
    
    // Get all cookies to find the session
    const allCookies = cookieStore.getAll()
    console.log('[CDP-Token] Available cookies:', allCookies.map(c => c.name))
    
    // Forward all cookies to the session endpoint
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')
    
    if (allCookies.length === 0) {
      return NextResponse.json(
        { error: 'No cookies found. Please log in first.' },
        { status: 401 }
      )
    }

    // Use our own API to get session (it uses the same cookies)
    const baseUrl = getBaseUrl()
    const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: {
        Cookie: cookieHeader,
      },
    })

    if (!sessionResponse.ok) {
      console.log('[CDP-Token] Session response not ok:', sessionResponse.status)
      // Try parsing error
      try {
        const errData = await sessionResponse.json()
        console.log('[CDP-Token] Session error:', errData)
      } catch {}
      
      return NextResponse.json(
        { error: 'No valid session found. Please log in first.' },
        { status: 401 }
      )
    }

    const session = await sessionResponse.json()
    console.log('[CDP-Token] Session data:', JSON.stringify(session).slice(0, 200))
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
