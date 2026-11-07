import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
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
      <div className="py-10 text-center text-gris">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-gris-claro shadow-suave">
          <Icon name="target" className="h-7 w-7" />
        </div>
        <div className="text-[14px]">Agrega deudas para ver tu plan de pago.</div>
      </div>
    )
  }

  return (
    <>
      {/* Meta */}
      <section className="hero mb-4">
        <div className="text-[12px] font-semibold tracking-[.08em] text-crema/70">TU META</div>
        <div className="my-1.5 text-[30px] font-bold leading-tight tracking-tight lg:text-[36px]">
          {terminado ? `Libre en ${meses} ${meses === 1 ? 'mes' : 'meses'}` : 'Sube el abono'}
        </div>
        <div className="text-[13px] leading-relaxed text-crema/75 lg:text-sm">
          {terminado
            ? `Abonando ${fmt(presupuesto)} al mes en total (${fmt(extra)} extra sobre tus cuotas).`
            : 'Con este abono, los intereses no te dejan terminar. Sube el extra mensual abajo.'}
        </div>
      </section>

      {/* Control del extra mensual */}
      <section className="card mb-4 p-[18px] md:max-w-2xl">
        <div className="mb-1 flex items-end justify-between">
          <h2 className="eyebrow">
            Extra mensual a la deuda
          </h2>
          <span className="text-[20px] font-bold text-verde-medio">{fmt(extra)}</span>
        </div>
        <p className="mb-3 text-[12px] text-gris">
          Cuánto pones cada mes <strong>además</strong> de tus cuotas mínimas ({fmtK(sumCuotas)}).
        </p>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={PASO}
          value={Math.min(extra, sliderMax)}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="h-11 w-full accent-verde-vivo"
        />
        <div className="flex justify-between text-[11px] text-gris">
          <span>$0</span>
          <span>{fmtK(sliderMax)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-crema px-3.5 py-3 text-[13px]">
          <span className="text-gris">Pago total mensual</span>
          <span className="font-bold">{fmt(presupuesto)}</span>
        </div>
      </section>

      {/* Plan mes a mes */}
      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <div key={p.mes} className="card">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-bold tracking-wide text-gris">MES {p.mes}</div>
              <div className="text-right">
                <div className="text-[11px] text-gris">restan</div>
                <div className="text-[15px] font-bold">{fmt(p.restante)}</div>
              </div>
            </div>
            <div className="mt-1 text-[15px] font-semibold">⚡ Atacar: {p.objetivo}</div>
            {p.liquidadas.map((l) => (
              <span
                key={l}
                className="mr-1 mt-2 inline-block rounded-full bg-verde-claro px-2.5 py-1 text-[11px] font-bold text-verde-medio"
              >
                ✓ {l}
              </span>
            ))}
            {terminado && p.mes === meses && (
              <div className="mt-2.5 rounded-xl bg-verde-claro px-3 py-2.5 text-[13px] font-semibold text-verde-medio">
                🏁 ¡Libre de deudas!
              </div>
            )}
          </div>
        ))}
      </div>

      {!terminado && (
        <p className="mt-3 rounded-xl bg-rojo-bg px-4 py-3 text-center text-[13px] font-medium text-rojo">
          Mostrando los primeros {TOPE_MESES} meses. Aumenta el abono extra para liquidar la deuda.
        </p>
      )}
    </>
  )
}
