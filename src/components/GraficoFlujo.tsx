import { nombreMes } from '../lib/fechas'
import type { FlujoMes } from '../lib/finanzas'
import { fmtK } from '../lib/format'

const etiquetaMes = (ym: string) => {
  const m = Number(ym.split('-')[1]) - 1
  return nombreMes(m).slice(0, 3)
}

/** Gráfico de barras: ingresos vs gastos por mes (CSS, responsive). */
export function GraficoFlujo({ datos }: { datos: FlujoMes[] }) {
  const max = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.gastos]))
  const hayDatos = datos.some((d) => d.ingresos > 0 || d.gastos > 0)

  if (!hayDatos) {
    return (
      <div className="py-8 text-center text-[13px] text-gris-claro">
        Aún no hay ingresos ni gastos registrados.
        <br />
        Toca el botón + para empezar.
      </div>
    )
  }

  return (
    <div>
      {/* Leyenda */}
      <div className="mb-4 flex items-center gap-4 text-[12px] text-gris">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-verde-vivo" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-rojo" /> Gastos
        </span>
      </div>

      {/* Barras */}
      <div className="flex h-36 items-end justify-between gap-2">
        {datos.map((d) => (
          <div key={d.mes} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <Barra valor={d.ingresos} max={max} color="bg-verde-vivo" />
              <Barra valor={d.gastos} max={max} color="bg-rojo" />
            </div>
            <span className="text-[10px] font-medium capitalize text-gris-claro">
              {etiquetaMes(d.mes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Barra({ valor, max, color }: { valor: number; max: number; color: string }) {
  const pct = Math.round((valor / max) * 100)
  return (
    <div className="group relative flex w-3.5 items-end sm:w-5" style={{ height: '100%' }}>
      <div
        className={`w-full rounded-t-md ${color} transition-all`}
        style={{ height: `${valor > 0 ? Math.max(pct, 3) : 0}%` }}
      />
      {valor > 0 && (
        <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-carbon/85 px-1.5 py-0.5 text-[9px] font-semibold text-crema opacity-0 transition group-hover:opacity-100">
          {fmtK(valor)}
        </span>
      )}
    </div>
  )
}
