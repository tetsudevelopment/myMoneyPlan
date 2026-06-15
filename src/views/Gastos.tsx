import { DonutChart } from '../components/DonutChart'
import { MovimientoItem } from '../components/MovimientoItem'
import { mesActual } from '../lib/fechas'
import { detectarHormiga, gastosPorCategoria } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'

export function Gastos() {
  const { estado } = useApp()
  const mes = mesActual()
  const porCat = gastosPorCategoria(estado.movimientos, mes)
  const hormiga = detectarHormiga(estado.movimientos, mes)
  const recientes = [...estado.movimientos]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 40)

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      {/* Columna izquierda: hormiga + donut */}
      <div>
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
      <div>
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
              <MovimientoItem key={String(m.id)} mov={m} deudas={estado.deudas} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
