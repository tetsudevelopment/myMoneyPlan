import { useMemo, useState } from 'react'
import { DonutChart } from '../components/DonutChart'
import { ModalRegistro } from '../components/ModalRegistro'
import { MovimientoItem } from '../components/MovimientoItem'
import { catById } from '../lib/constantes'
import { mesActual } from '../lib/fechas'
import { detectarHormiga, gastosPorCategoria } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Movimiento, TipoMovimiento } from '../types'

type FiltroTipo = 'todos' | TipoMovimiento

const TIPOS: { id: FiltroTipo; lbl: string }[] = [
  { id: 'todos', lbl: 'Todos' },
  { id: 'gasto', lbl: 'Gastos' },
  { id: 'ingreso', lbl: 'Ingresos' },
  { id: 'abono', lbl: 'Abonos' },
]

export function Gastos() {
  const { estado } = useApp()
  const nombreCat = (id: string) => catById(id, estado.categorias).nombre
  const mes = mesActual()
  const porCat = gastosPorCategoria(estado.movimientos, mes)
  const hormiga = detectarHormiga(estado.movimientos, mes)

  const [fTipo, setFTipo] = useState<FiltroTipo>('todos')
  const [fCat, setFCat] = useState('') // '' = todas
  const [editar, setEditar] = useState<Movimiento | null>(null)

  // Categorías que realmente tienen gastos (para el filtro)
  const catsPresentes = useMemo(() => {
    const set = new Set<string>()
    for (const m of estado.movimientos) if (m.tipo === 'gasto' && m.cat) set.add(m.cat)
    return [...set]
  }, [estado.movimientos])

  // Orden por creación (más reciente primero). Cae a la fecha si no hay marca.
  const filtrados = useMemo(() => {
    return [...estado.movimientos]
      .filter((m) => {
        if (fTipo !== 'todos' && m.tipo !== fTipo) return false
        if (fTipo === 'gasto' && fCat && m.cat !== fCat) return false
        return true
      })
      .sort((a, b) => (b.creadoEn ?? b.fecha).localeCompare(a.creadoEn ?? a.fecha))
  }, [estado.movimientos, fTipo, fCat])

  const totalFiltrado = filtrados.reduce((s, m) => s + m.monto, 0)

  const cambiarTipo = (t: FiltroTipo) => {
    setFTipo(t)
    if (t !== 'gasto') setFCat('')
  }

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
          Movimientos
        </h2>

        {/* Filtros */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => cambiarTipo(t.id)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
                fTipo === t.id ? 'bg-verde-prof text-crema' : 'bg-white text-gris shadow-suave'
              }`}
            >
              {t.lbl}
            </button>
          ))}
        </div>

        {/* Filtro por categoría (solo en Gastos) */}
        {fTipo === 'gasto' && catsPresentes.length > 0 && (
          <select
            value={fCat}
            onChange={(e) => setFCat(e.target.value)}
            className="mb-3 w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-verde-vivo sm:max-w-xs"
          >
            <option value="">Todas las categorías</option>
            {catsPresentes.map((c) => (
              <option key={c} value={c}>
                {nombreCat(c)}
              </option>
            ))}
          </select>
        )}

        {/* Resumen del filtro */}
        {filtrados.length > 0 && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-verde-claro/60 px-3.5 py-2 text-[12.5px]">
            <span className="font-medium text-verde-medio">
              {filtrados.length} {filtrados.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
            <span className="font-bold text-verde-medio">{fmt(totalFiltrado)}</span>
          </div>
        )}

        {filtrados.length === 0 ? (
          <div className="py-8 text-center text-gris-claro">
            <div className="mb-2 text-4xl">📝</div>
            <div className="text-[13px]">
              {estado.movimientos.length === 0
                ? 'Aún no has registrado movimientos. Toca el botón + para empezar.'
                : 'No hay movimientos con este filtro.'}
            </div>
          </div>
        ) : (
          <div className="rounded-card bg-white px-[18px] shadow-suave">
            {filtrados.map((m) => (
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
