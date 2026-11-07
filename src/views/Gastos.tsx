import { useMemo, useState } from 'react'
import { DonutChart } from '../components/DonutChart'
import { ModalRegistro } from '../components/ModalRegistro'
import { Icon } from '../components/Icon'
import { MovimientoItem } from '../components/MovimientoItem'
import { catById } from '../lib/constantes'
import { mesActual } from '../lib/fechas'
import { detectarHormiga, gastosPorCategoria } from '../lib/finanzas'
import { fmt, fmtUSD } from '../lib/format'
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

  // COP y USD nunca se suman entre sí.
  const totalFiltrado = filtrados.filter((m) => m.moneda !== 'USD').reduce((s, m) => s + m.monto, 0)
  const totalFiltradoUSD = filtrados.filter((m) => m.moneda === 'USD').reduce((s, m) => s + m.monto, 0)

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
              <span className="text-[20px]">🐜</span>
              <strong className="text-[14px] text-ambar">Gastos hormiga detectados</strong>
            </div>
            <p className="text-[13px] leading-relaxed text-[#7A4E18]">
              Llevas <strong>{fmt(hormiga.total)}</strong> este mes en {hormiga.cantidad} gastos
              pequeños (comida fuera, gaming, suscripciones). Si los recortas, ese dinero podría ir
              directo a tu deuda objetivo.
            </p>
          </div>
        )}

        <section className="card p-[18px] lg:sticky lg:top-6">
          <h2 className="eyebrow mb-3">
            Gastos por categoría — este mes
          </h2>
          <DonutChart datos={porCat} />
        </section>
      </div>

      {/* Columna derecha: movimientos */}
      <div className="min-w-0">
        <h2 className="eyebrow mx-1 mb-2.5 mt-6 lg:mt-0">
          Movimientos
        </h2>

        {/* Filtros */}
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => cambiarTipo(t.id)}
              aria-pressed={fTipo === t.id}
              className={`chip flex-shrink-0 ${
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
            className="field mb-3 sm:max-w-xs"
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
          <div className="mb-2 flex items-center justify-between rounded-xl bg-verde-claro px-3.5 py-2.5 text-[13px]">
            <span className="font-medium text-verde-medio">
              {filtrados.length} {filtrados.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
            {/* Con "Todos" sumar ingresos+gastos+abonos no significa nada: solo con un tipo. */}
            {fTipo !== 'todos' && (
              <span className="font-bold text-verde-medio">
                {totalFiltradoUSD > 0 && totalFiltrado === 0 ? '' : fmt(totalFiltrado)}
                {totalFiltradoUSD > 0 && (
                  <>
                    {totalFiltrado > 0 ? ' + ' : ''}
                    {fmtUSD(totalFiltradoUSD)}
                  </>
                )}
              </span>
            )}
          </div>
        )}

        {filtrados.length === 0 ? (
          <div className="py-10 text-center text-gris">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-gris-claro shadow-suave">
              <Icon name="note" className="h-7 w-7" />
            </div>
            <div className="mx-auto max-w-[17rem] text-[14px]">
              {estado.movimientos.length === 0
                ? 'Aún no has registrado movimientos. Toca el botón + para empezar.'
                : 'No hay movimientos con este filtro.'}
            </div>
          </div>
        ) : (
          <div className="card px-4 py-1">
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
        <p className="mt-3 px-1 text-center text-[12px] text-gris">
          Toca un movimiento para editarlo o eliminarlo.
        </p>
      </div>

      <ModalRegistro abierto={!!editar} movEditar={editar} onCerrar={() => setEditar(null)} />
    </div>
  )
}
