import { useMemo } from 'react'
import { generarPlan, presupuestoDeudaDefault } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'

export function Plan() {
  const { estado } = useApp()

  const { plan, presupuesto, extra } = useMemo(() => {
    const cuotas = estado.deudas.reduce((s, d) => s + d.cuota, 0)
    const presupuesto = presupuestoDeudaDefault(estado.deudas)
    return { plan: generarPlan(estado.deudas, presupuesto), presupuesto, extra: presupuesto - cuotas }
  }, [estado.deudas])

  const meses = plan.length

  return (
    <>
      <section className="mb-4 rounded-card bg-gradient-to-br from-verde-prof to-verde-medio p-[18px] text-crema shadow-suave lg:p-7">
        <div className="text-xs font-medium opacity-70">TU META</div>
        <div className="my-1 text-[26px] font-bold lg:text-[34px]">
          {meses > 0 ? `Libre en ${meses} ${meses === 1 ? 'mes' : 'meses'}` : '¡Sin deudas!'}
        </div>
        <div className="text-[12.5px] opacity-65 lg:text-sm">
          Pagando {fmt(extra)} extra cada mes sobre la deuda objetivo ({fmt(presupuesto)}/mes en
          total).
        </div>
      </section>

      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {plan.map((p) => (
          <div key={p.mes} className="rounded-card bg-white px-4 py-3.5 shadow-suave">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-gris-claro">MES {p.mes}</div>
              <div className="text-sm font-bold">{fmt(p.pago)}</div>
            </div>
            <div className="mt-0.5 text-sm font-semibold">⚡ Atacar: {p.objetivo}</div>
            {p.liquidadas.map((l) => (
              <span
                key={l}
                className="mr-1 mt-1.5 inline-block rounded-full bg-verde-claro px-2 py-0.5 text-[10px] font-bold text-verde-vivo"
              >
                ✓ {l}
              </span>
            ))}
            {p.mes === meses && (
              <div className="mt-2 rounded-[10px] bg-verde-claro px-3 py-2 text-xs font-semibold text-verde-medio">
                🏁 ¡Libre de deudas!
              </div>
            )}
          </div>
        ))}
      </div>

      {plan.length === 0 && (
        <div className="py-10 text-center text-gris-claro">
          <div className="mb-2 text-4xl">🎉</div>
          <div className="text-[13px]">No tienes deudas activas en el plan.</div>
        </div>
      )}
    </>
  )
}
