import { useState } from 'react'
import { DonutChart } from '../components/DonutChart'
import { ModalRegistro } from '../components/ModalRegistro'
import { MovimientoItem } from '../components/MovimientoItem'
import { mesActual } from '../lib/fechas'
import { detectarHormiga, gastosPorCategoria } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Movimiento } from '../types'

export function Gastos() {
  const { estado } = useApp()
  const mes = mesActual()
  const porCat = gastosPorCategoria(estado.movimientos, mes)
  const hormiga = detectarHormiga(estado.movimientos, mes)
  // Orden por fecha desc (los ids ya no son cronológicos). El sort estable
  // conserva el orden de inserción dentro del mismo día.
  const recientes = [...estado.movimientos]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 40)

  const [editar, setEditar] = useState<Movimiento | null>(null)

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      {/* Columna izquierda: hormiga + donut */}
      <div className="min-w-0">
        {hormiga.activa && (
          <div className="mb-3.5 rounded-2xl border border-[#F0D5BC] bg-gradient-to-br from-[#FDF0E6] to-[#FAE6D5] p-[15px]">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[18px]">🐜</span>
              <strong className="text-[13px] text-ambar">Gastos hormiga detectados</strong>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[#8A5A1E]">
              Llevas <strong>{fmt(hormiga.total)}</strong> este mes en {hormiga.cantidad} gastos
              pequeños (comida fuera, gaming, suscripciones). Si los recortas, ese dinero podría ir
              directo a tu deuda objetivo.
            </p>
          </div>
        )}

        <section className="rounded-card bg-white p-[18px] shadow-suave lg:sticky lg:top-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gris">
            Gastos por categoría — este mes
          </h2>
          <DonutChart datos={porCat} />
        </section>
      </div>

      {/* Columna derecha: movimientos */}
      <div className="min-w-0">
        <h2 className="mx-1 mb-2.5 mt-[18px] text-[13px] font-bold uppercase tracking-wide text-gris lg:mt-0">
          Movimientos recientes
        </h2>
        {recientes.length === 0 ? (
          <div className="py-8 text-center text-gris-claro">
            <div className="mb-2 text-4xl">📝</div>
            <div className="text-[13px]">
              Aún no has registrado movimientos.
              <br />
              Toca el botón + para empezar.
            </div>
          </div>
        ) : (
          <div className="rounded-card bg-white px-[18px] shadow-suave">
            {recientes.map((m) => (
              <MovimientoItem
                key={String(m.id)}
                mov={m}
                deudas={estado.deudas}
                onSelect={() => setEditar(m)}
              />
            ))}
          </div>
        )}
        <p className="mt-2 px-1 text-center text-[11px] text-gris-claro">
          Toca un movimiento para editarlo o eliminarlo.
        </p>
      </div>

      <ModalRegistro abierto={!!editar} movEditar={editar} onCerrar={() => setEditar(null)} />
    </div>
  )
}
