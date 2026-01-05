import { SignJWT, exportJWK, generateKeyPair, importPKCS8, importSPKI } from 'jose'

// We'll store keys in environment variables
// In production, you'd want to use a proper key management service

const CDP_JWT_PRIVATE_KEY = process.env.CDP_JWT_PRIVATE_KEY
const CDP_JWT_PUBLIC_KEY = process.env.CDP_JWT_PUBLIC_KEY
const CDP_JWT_KID = process.env.CDP_JWT_KID || 'cdp-key-1'

let cachedKeyPair: { privateKey: CryptoKey; publicKey: CryptoKey } | null = null

export async function getKeyPair() {
  if (cachedKeyPair) return cachedKeyPair

  if (CDP_JWT_PRIVATE_KEY && CDP_JWT_PUBLIC_KEY) {
    // Import from environment variables
    const privateKey = await importPKCS8(CDP_JWT_PRIVATE_KEY, 'ES256')
    const publicKey = await importSPKI(CDP_JWT_PUBLIC_KEY, 'ES256')
    cachedKeyPair = { privateKey, publicKey }
    return cachedKeyPair
  }

  // Generate new key pair (for development - in production use env vars)
  const keyPair = await generateKeyPair('ES256')
  cachedKeyPair = keyPair
  
  // Log keys for initial setup (remove in production)
  const privateJwk = await exportJWK(keyPair.privateKey)
  const publicJwk = await exportJWK(keyPair.publicKey)
  console.log('[CDP-JWT] Generated new ES256 key pair. Add these to your environment:')
  console.log('[CDP-JWT] Private JWK:', JSON.stringify(privateJwk))
  console.log('[CDP-JWT] Public JWK:', JSON.stringify(publicJwk))
  
  return cachedKeyPair
}

export async function getPublicJWKS() {
  const { publicKey } = await getKeyPair()
  const jwk = await exportJWK(publicKey)
  
  return {
    keys: [
      {
        ...jwk,
        kid: CDP_JWT_KID,
        alg: 'ES256',
        use: 'sig',
      },
    ],
  }
}

export interface CDPTokenPayload {
  sub: string
  email?: string
  name?: string
}

export async function signCDPToken(payload: CDPTokenPayload, issuer: string, audience: string) {
  const { privateKey } = await getKeyPair()
  
  const jwt = await new SignJWT({
    ...payload,
  })
    .setProtectedHeader({ alg: 'ES256', kid: CDP_JWT_KID })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(payload.sub)
    .setExpirationTime('15m') // Short-lived token
    .sign(privateKey)

  return jwt
}
