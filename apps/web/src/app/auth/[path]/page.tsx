import { AuthView } from '@neondatabase/neon-js/auth/react/ui'
import Image from 'next/image'
import Link from 'next/link'

export const dynamicParams = false

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>
}) {
  const { path } = await params

  const isSignUp = path === 'sign-up'
  const title = isSignUp ? 'Create your account' : 'Welcome back'
  const subtitle = isSignUp
    ? 'Get started with secure digital asset issuance infrastructure designed for the digital economy.'
    : "Don't have an account yet?"

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(121,40,202,0.22),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(0,112,243,0.22),transparent_45%),radial-gradient(circle_at_45%_90%,rgba(16,185,129,0.14),transparent_45%)]" />
        <div className="absolute inset-0 ntzs-auth-grid-drift bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <div className="pointer-events-none absolute inset-0 ntzs-auth-scanline" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="ntzs-auth-entrance relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl md:p-9">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl ntzs-auth-glow" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/5 blur-3xl ntzs-auth-glow" />

            <div className="relative">
              <div className="mx-auto flex w-full flex-col items-center text-center">
                <div className="ntzs-float-3d ntzs-text-reveal ntzs-delay-1 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                  <div className="overflow-hidden rounded-full">
                    <Image src="/ntzs-logo.png" alt="nTZS" width={38} height={38} />
                  </div>
                </div>

                <h1 className="ntzs-text-reveal ntzs-delay-2 ntzs-title-sheen mt-5 text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                <div className="ntzs-title-underline ntzs-delay-3 mt-4 h-px w-24" />

                <p className="ntzs-text-reveal ntzs-delay-3 mt-3 text-sm leading-6 text-white/70">
                  {subtitle}{' '}
                  {isSignUp ? null : (
                    <Link href="/auth/sign-up" className="text-white underline underline-offset-4">
                      Sign up
                    </Link>
                  )}
                </p>
              </div>

              <div className="ntzs-text-reveal ntzs-delay-4 mt-6">
                <AuthView path={path} />
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-white/60">
                <Link href="/" className="hover:text-white">
                  Back to home
                </Link>
                {isSignUp ? (
                  <Link href="/auth/sign-in" className="hover:text-white">
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
