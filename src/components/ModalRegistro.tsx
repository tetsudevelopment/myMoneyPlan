import { useEffect, useState } from 'react'
import { CATEGORIAS } from '../lib/constantes'
import { deudasVivas } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { TipoMovimiento } from '../types'

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Si viene, abre directo en modo abono con esta deuda preseleccionada. */
  abonoDeudaId?: string | null
}

const TIPOS: { id: TipoMovimiento; lbl: string }[] = [
  { id: 'gasto', lbl: 'Gasto' },
  { id: 'ingreso', lbl: 'Ingreso' },
  { id: 'abono', lbl: 'Abono deuda' },
]

export function ModalRegistro({ abierto, onCerrar, abonoDeudaId }: Props) {
  const { estado, registrarMovimiento, notificar } = useApp()
  const vivas = deudasVivas(estado.deudas)

  const [tipo, setTipo] = useState<TipoMovimiento>('gasto')
  const [monto, setMonto] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('mercado')
  const [deudaId, setDeudaId] = useState('')

  // Resetea el formulario cada vez que se abre.
  useEffect(() => {
    if (!abierto) return
    if (abonoDeudaId) {
      setTipo('abono')
      setDeudaId(abonoDeudaId)
    } else {
      setTipo('gasto')
      setDeudaId(vivas[0]?.id ?? '')
    }
    setMonto('')
    setDesc('')
    setCat('mercado')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, abonoDeudaId])

  if (!abierto) return null

  const guardar = () => {
    const valor = parseFloat(monto)
    if (!valor || valor <= 0) {
      notificar('Ingresa un monto válido')
      return
    }
    if (tipo === 'gasto') registrarMovimiento({ tipo, monto: valor, desc: desc.trim(), cat })
    else if (tipo === 'ingreso')
      registrarMovimiento({ tipo, monto: valor, desc: desc.trim() || 'Ingreso' })
    else {
      if (!deudaId) {
        notificar('Elige una deuda')
        return
      }
      registrarMovimiento({ tipo, monto: valor, deudaId })
    }
    onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-verde-prof/45 lg:items-center lg:justify-center lg:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="mx-auto max-h-[88vh] w-full max-w-app overflow-y-auto rounded-t-[24px] bg-crema px-[18px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[22px] lg:max-w-md lg:rounded-[24px] lg:pb-[22px] lg:shadow-suave-lg">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-linea lg:hidden" />
        <h3 className="mb-4 text-lg font-bold">
          {tipo === 'abono' ? 'Registrar abono' : 'Registrar movimiento'}
        </h3>

        {/* Selector de tipo */}
        <div className="mb-3.5 flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className={`flex-1 rounded-xl border-[1.5px] py-3 text-sm font-semibold transition ${
                tipo === t.id
                  ? 'border-verde-prof bg-verde-prof text-crema'
                  : 'border-linea bg-white text-gris'
              }`}
            >
              {t.lbl}
            </button>
          ))}
        </div>

        {/* Monto */}
        <Campo label="Monto">
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            autoFocus
            className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
          />
        </Campo>

        {/* Descripción (gasto / ingreso) */}
        {tipo !== 'abono' && (
          <Campo label="Descripción">
            <input
              type="text"
              placeholder="Ej: Almuerzo, Recibí pago..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
            />
          </Campo>
        )}

        {/* Categoría (solo gasto) */}
        {tipo === 'gasto' && (
          <Campo label="Categoría">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`flex flex-col items-center gap-1 rounded-[13px] border-[1.5px] px-1 py-2.5 transition ${
                    c.id === cat ? 'border-verde-vivo bg-verde-claro' : 'border-linea bg-white'
                  }`}
                >
                  <span className="text-[22px]">{c.icono}</span>
                  <span className="text-center text-[10px] font-medium leading-tight">{c.nombre}</span>
                </button>
              ))}
            </div>
          </Campo>
        )}

        {/* Deuda (solo abono) */}
        {tipo === 'abono' && (
          <Campo label="¿A qué deuda?">
            <select
              value={deudaId}
              onChange={(e) => setDeudaId(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
            >
              {vivas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} — {fmt(d.saldo)}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <button
          onClick={guardar}
          className="w-full rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition active:scale-[.98]"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-semibold text-gris">{label}</label>
      {children}
    </div>
  )
}
