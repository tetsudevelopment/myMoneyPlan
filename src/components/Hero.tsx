import type { ReactNode } from 'react'

/** Tarjeta protagonista de cada vista: una cifra grande y su contexto. */
export function Hero({
  label,
  valor,
  detalle,
  children,
  className = 'mb-4',
}: {
  label: string
  valor: string
  detalle?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={`hero relative isolate overflow-hidden ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-verde-vivo/25 blur-3xl"
      />
      <p className="text-[12px] font-semibold uppercase tracking-[.08em] text-crema/70">{label}</p>
      <p className="mt-2 text-[36px] font-bold leading-none tracking-tight lg:text-[44px]">{valor}</p>
      {detalle && <p className="mt-2 text-[13px] text-crema/75">{detalle}</p>}
      {children}
    </section>
  )
}
