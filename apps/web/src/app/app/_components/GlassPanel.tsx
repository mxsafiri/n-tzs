import type { ReactNode } from 'react'

export function GlassPanel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
      <div className="relative">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{description}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  )
}
