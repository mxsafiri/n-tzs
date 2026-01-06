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
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{description}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  )
}
