import { fmt } from '../lib/format'

export interface PuntoFlujo {
  etiqueta: string
  ingresos: number
  gastos: number
}

/** Gráfico de barras: ingresos vs gastos por punto (mes o día). CSS, responsive. */
export function GraficoFlujo({ datos }: { datos: PuntoFlujo[] }) {
  const max = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.gastos]))
  const hayDatos = datos.some((d) => d.ingresos > 0 || d.gastos > 0)
  const muchos = datos.length > 12 // vista diaria: columnas fijas + scroll

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
      <div className={muchos ? 'overflow-x-auto pb-1' : ''}>
        <div
          className={`flex items-end gap-1.5 ${muchos ? 'min-w-max' : 'justify-between gap-2'}`}
        >
          {datos.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center ${muchos ? 'w-6' : 'flex-1'}`}
            >
              <div className="flex h-32 w-full items-end justify-center gap-[3px]">
                <div
                  className={`rounded-t bg-verde-vivo transition-all ${muchos ? 'w-2' : 'w-3.5 sm:w-5'}`}
                  style={{ height: altura(d.ingresos) }}
                  title={`${d.etiqueta} · Ingresos: ${fmt(d.ingresos)}`}
                />
                <div
                  className={`rounded-t bg-rojo transition-all ${muchos ? 'w-2' : 'w-3.5 sm:w-5'}`}
                  style={{ height: altura(d.gastos) }}
                  title={`${d.etiqueta} · Gastos: ${fmt(d.gastos)}`}
                />
              </div>
              <span className="mt-1.5 text-center text-[10px] font-medium capitalize text-gris-claro">
                {d.etiqueta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
