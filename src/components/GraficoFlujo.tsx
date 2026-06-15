import { nombreMes } from '../lib/fechas'
import type { FlujoMes } from '../lib/finanzas'
import { fmt } from '../lib/format'

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
        Toca el botón + para registrar uno.
      </div>
    )
  }

  const altura = (v: number) => (v > 0 ? `${Math.max((v / max) * 100, 4)}%` : '0%')

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
      <div className="flex items-end justify-between gap-2">
        {datos.map((d) => (
          <div key={d.mes} className="flex flex-1 flex-col items-center">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div
                className="w-3.5 rounded-t-md bg-verde-vivo transition-all sm:w-5"
                style={{ height: altura(d.ingresos) }}
                title={`Ingresos: ${fmt(d.ingresos)}`}
              />
              <div
                className="w-3.5 rounded-t-md bg-rojo transition-all sm:w-5"
                style={{ height: altura(d.gastos) }}
                title={`Gastos: ${fmt(d.gastos)}`}
              />
            </div>
            <span className="mt-1.5 text-center text-[10px] font-medium capitalize text-gris-claro">
              {etiquetaMes(d.mes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
