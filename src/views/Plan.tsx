import { useMemo, useState } from 'react'
import { generarPlan } from '../lib/finanzas'
import { fmt, fmtK } from '../lib/format'
import { useApp } from '../store/AppContext'

const PASO = 50_000
const TOPE_MESES = 60 // no renderizar planes absurdamente largos

const redondear = (n: number) => Math.round(n / PASO) * PASO

export function Plan() {
  const { estado } = useApp()

  const sumCuotas = useMemo(
    () => estado.deudas.reduce((s, d) => s + d.cuota, 0),
    [estado.deudas],
  )

  // Extra mensual por defecto: lo que sobra del ingreso tras las cuotas mínimas.
  const extraDefault = Math.max(0, redondear(estado.config.ingresoMensual - sumCuotas))
  const [extra, setExtra] = useState(extraDefault)
  const sliderMax = Math.max(
    1_000_000,
    redondear(Math.max(estado.config.ingresoMensual, sumCuotas * 2)),
  )

  const presupuesto = sumCuotas + extra
  const plan = useMemo(
    () => generarPlan(estado.deudas, presupuesto),
    [estado.deudas, presupuesto],
  )

  const terminado = plan.length > 0 && plan[plan.length - 1].restante <= 1
  const meses = plan.length
  const visibles = plan.slice(0, TOPE_MESES)

  if (estado.deudas.length === 0) {
    return (
      <div className="py-10 text-center text-gris-claro">
        <div className="mb-2 text-4xl">🎯</div>
        <div className="text-[13px]">Agrega deudas para ver tu plan de pago.</div>
      </div>
    )
  }

  return (
    <>
      {/* Meta */}
      <section className="mb-4 rounded-card bg-gradient-to-br from-verde-prof to-verde-medio p-[18px] text-crema shadow-suave lg:p-7">
        <div className="text-xs font-medium opacity-70">TU META</div>
        <div className="my-1 text-[26px] font-bold lg:text-[34px]">
          {terminado ? `Libre en ${meses} ${meses === 1 ? 'mes' : 'meses'}` : 'Sube el abono'}
        </div>
        <div className="text-[12.5px] opacity-65 lg:text-sm">
          {terminado
            ? `Abonando ${fmt(presupuesto)} al mes en total (${fmt(extra)} extra sobre tus cuotas).`
            : 'Con este abono, los intereses no te dejan terminar. Sube el extra mensual abajo.'}
        </div>
      </section>

      {/* Control del extra mensual */}
      <section className="mb-4 rounded-card bg-white p-[18px] shadow-suave md:max-w-2xl">
        <div className="mb-1 flex items-end justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gris">
            Extra mensual a la deuda
          </h2>
          <span className="text-lg font-bold text-verde-medio">{fmt(extra)}</span>
        </div>
        <p className="mb-3 text-[11.5px] text-gris-claro">
          Cuánto pones cada mes <strong>además</strong> de tus cuotas mínimas ({fmtK(sumCuotas)}).
        </p>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={PASO}
          value={Math.min(extra, sliderMax)}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="w-full accent-verde-vivo"
        />
        <div className="mt-1 flex justify-between text-[10px] text-gris-claro">
          <span>$0</span>
          <span>{fmtK(sliderMax)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-crema px-3.5 py-2.5 text-[12.5px]">
          <span className="text-gris">Pago total mensual</span>
          <span className="font-bold">{fmt(presupuesto)}</span>
        </div>
      </section>

      {/* Plan mes a mes */}
      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <div key={p.mes} className="rounded-card bg-white px-4 py-3.5 shadow-suave">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-gris-claro">MES {p.mes}</div>
              <div className="text-right">
                <div className="text-[10px] text-gris-claro">restan</div>
                <div className="text-sm font-bold">{fmt(p.restante)}</div>
              </div>
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
            {terminado && p.mes === meses && (
              <div className="mt-2 rounded-[10px] bg-verde-claro px-3 py-2 text-xs font-semibold text-verde-medio">
                🏁 ¡Libre de deudas!
              </div>
            )}
          </div>
        ))}
      </div>

      {!terminado && (
        <p className="mt-3 rounded-xl bg-rojo-bg px-4 py-3 text-center text-[12.5px] font-medium text-rojo">
          Mostrando los primeros {TOPE_MESES} meses. Aumenta el abono extra para liquidar la deuda.
        </p>
      )}
    </>
  )
}
