import { SignJWT, importJWK, type JWK } from 'jose'

// Store keys as JWK in environment variables
// Generate once and store permanently
const CDP_JWT_PRIVATE_KEY_JWK = process.env.CDP_JWT_PRIVATE_KEY_JWK
const CDP_JWT_PUBLIC_KEY_JWK = process.env.CDP_JWT_PUBLIC_KEY_JWK
const CDP_JWT_KID = process.env.CDP_JWT_KID || 'cdp-key-1'

// Fallback development keys (generate your own for production!)
// These are pre-generated ES256 keys for initial setup
const DEV_PRIVATE_KEY: JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
  y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
  d: 'jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI',
  alg: 'ES256',
  use: 'sig',
}

const DEV_PUBLIC_KEY: JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
  y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
  alg: 'ES256',
  use: 'sig',
}

let cachedPrivateKey: CryptoKey | null = null
let cachedPublicJwk: JWK | null = null

export async function getPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey

  let jwk: JWK
  if (CDP_JWT_PRIVATE_KEY_JWK) {
    jwk = JSON.parse(CDP_JWT_PRIVATE_KEY_JWK)
  } else {
    console.warn('[CDP-JWT] Using development keys. Set CDP_JWT_PRIVATE_KEY_JWK in production!')
    jwk = DEV_PRIVATE_KEY
  }

  cachedPrivateKey = await importJWK(jwk, 'ES256') as CryptoKey
  return cachedPrivateKey
}

export async function getPublicKeyJwk(): Promise<JWK> {
  if (cachedPublicJwk) return cachedPublicJwk

  let jwk: JWK
  if (CDP_JWT_PUBLIC_KEY_JWK) {
    jwk = JSON.parse(CDP_JWT_PUBLIC_KEY_JWK)
  } else {
    jwk = DEV_PUBLIC_KEY
  }

  cachedPublicJwk = jwk
  return jwk
}

export async function getPublicJWKS() {
  const jwk = await getPublicKeyJwk()
  
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
  const privateKey = await getPrivateKey()
  
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
