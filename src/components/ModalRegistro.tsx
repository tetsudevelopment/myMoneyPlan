import { useEffect, useState } from 'react'
import { todasCategorias } from '../lib/constantes'
import { deudasVivas } from '../lib/finanzas'
import { fmt, fmtUSD } from '../lib/format'
import { useEscape } from '../lib/useEscape'
import { useApp } from '../store/AppContext'
import type { Moneda, Movimiento, TipoMovimiento } from '../types'
import { ModalCategoria } from './ModalCategoria'
import { SheetTitulo } from './SheetTitulo'
import { MoneyInput } from './MoneyInput'

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Abono con esta deuda preseleccionada (modo crear). */
  abonoDeudaId?: string | null
  /** Si viene, el modal edita ese movimiento en vez de crear uno. */
  movEditar?: Movimiento | null
}

const TIPOS: { id: TipoMovimiento; lbl: string }[] = [
  { id: 'gasto', lbl: 'Gasto' },
  { id: 'ingreso', lbl: 'Ingreso' },
  { id: 'abono', lbl: 'Abono' },
]

export function ModalRegistro({ abierto, onCerrar, abonoDeudaId, movEditar }: Props) {
  const { estado, registrarMovimiento, editarMovimiento, eliminarMovimiento, notificar } = useApp()
  const vivas = deudasVivas(estado.deudas)
  const categorias = todasCategorias(estado.categorias)
  const bolsillosUSD = estado.bolsillos.filter((b) => b.moneda === 'USD')
  const editando = !!movEditar

  const [tipo, setTipo] = useState<TipoMovimiento>('gasto')
  const [monto, setMonto] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('mercado')
  const [deudaId, setDeudaId] = useState('')
  const [modalCat, setModalCat] = useState(false)
  const [moneda, setMoneda] = useState<Moneda>('COP')
  const [bolsilloId, setBolsilloId] = useState('')

  useEffect(() => {
    if (!abierto) return
    if (movEditar) {
      setTipo(movEditar.tipo)
      setMoneda(movEditar.moneda === 'USD' ? 'USD' : 'COP')
      // Solo se conserva si el bolsillo aún existe; si no, el usuario debe elegir uno.
      setBolsilloId(bolsillosUSD.some((b) => b.id === movEditar.bolsilloId) ? movEditar.bolsilloId! : '')
      // USD conserva centavos; COP va en pesos enteros.
      setMonto(movEditar.moneda === 'USD' ? String(movEditar.monto) : String(Math.round(movEditar.monto)))
      setDesc(movEditar.desc ?? '')
      setCat(movEditar.cat ?? 'mercado')
      setDeudaId(movEditar.deudaId ?? vivas[0]?.id ?? '')
    } else if (abonoDeudaId) {
      setTipo('abono')
      setMoneda('COP')
      setDeudaId(abonoDeudaId)
      setMonto('')
      setDesc('')
      setCat('mercado')
    } else {
      setTipo('gasto')
      setMoneda('COP')
      setBolsilloId(bolsillosUSD[0]?.id ?? '')
      setDeudaId(vivas[0]?.id ?? '')
      setMonto('')
      setDesc('')
      setCat('mercado')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, abonoDeudaId, movEditar])

  useEscape(abierto && !modalCat, onCerrar)

  if (!abierto) return null

  const guardar = () => {
    const valor = parseFloat(monto)
    if (!valor || valor <= 0) return notificar('Ingresa un monto válido')

    if (editando && movEditar) {
      const cambios =
        tipo === 'gasto'
          ? { monto: valor, desc: desc.trim(), cat }
          : tipo === 'ingreso'
            ? {
                monto: valor,
                desc: desc.trim() || 'Ingreso',
                ...(movEditar.moneda === 'USD' && bolsilloId ? { bolsilloId } : {}),
              }
            : { monto: valor, deudaId }
      if (tipo === 'abono' && !deudaId) return notificar('Elige una deuda')
      if (editarMovimiento(movEditar.id, cambios)) onCerrar()
      return
    }

    if (tipo === 'gasto') registrarMovimiento({ tipo, monto: valor, desc: desc.trim(), cat })
    else if (tipo === 'ingreso')
      registrarMovimiento({
        tipo,
        monto: valor,
        desc: desc.trim() || 'Ingreso',
        // Si no hay bolsillo USD, el store crea "Dólares" automáticamente.
        ...(moneda === 'USD' ? { moneda, ...(bolsilloId ? { bolsilloId } : {}) } : {}),
      })
    else {
      if (!deudaId) return notificar('Elige una deuda')
      registrarMovimiento({ tipo, monto: valor, deudaId })
    }
    onCerrar()
  }

  const borrar = async () => {
    if (!movEditar) return
    onCerrar()
    await eliminarMovimiento(movEditar.id)
  }

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet lg:max-w-md">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar}>
          {editando ? 'Editar movimiento' : tipo === 'abono' ? 'Registrar abono' : 'Registrar movimiento'}
        </SheetTitulo>

        {/* Selector de tipo (bloqueado al editar) */}
        {!editando && (
          <div className="seg mb-4">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                aria-pressed={tipo === t.id}
                className="seg-btn"
              >
                {t.lbl}
              </button>
            ))}
          </div>
        )}

        {/* Solo los ingresos pueden ser en dólares (moneda fija al editar) */}
        {tipo === 'ingreso' && !editando && (
          <div className="seg mb-4">
            {(['COP', 'USD'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMoneda(m)
                  setMonto('')
                }}
                aria-pressed={moneda === m}
                className="seg-btn"
              >
                {m === 'COP' ? 'Pesos (COP)' : 'Dólares (USD)'}
              </button>
            ))}
          </div>
        )}

        <Campo label="Monto">
          <MoneyInput value={monto} onChange={setMonto} autoFocus moneda={tipo === 'ingreso' ? moneda : 'COP'} />
        </Campo>

        {tipo === 'ingreso' && moneda === 'USD' && (
          <Campo label="¿A qué bolsillo en dólares?">
            {bolsillosUSD.length === 0 ? (
              <p className="rounded-xl border border-dashed border-linea bg-white px-3.5 py-3 text-[13px] text-gris">
                {editando
                  ? 'Este ingreso no tiene un bolsillo asociado.'
                  : 'Aún no tienes uno: se creará un bolsillo llamado «Dólares».'}
              </p>
            ) : (
              <select
                value={bolsilloId}
                onChange={(e) => setBolsilloId(e.target.value)}
                className="field"
              >
                {editando && !bolsilloId && <option value="">Sin bolsillo (elige uno)</option>}
                {bolsillosUSD.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} — {fmtUSD(b.saldo)}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        )}

        {tipo !== 'abono' && (
          <Campo label="Descripción">
            <input
              type="text"
              placeholder="Ej: Almuerzo, Recibí pago..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="field"
            />
          </Campo>
        )}

        {tipo === 'gasto' && (
          <Campo label="Categoría">
            <div className="grid grid-cols-4 gap-2">
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCat(c.id)}
                  aria-pressed={c.id === cat}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border px-1 py-2 transition active:scale-95 ${
                    c.id === cat
                      ? 'border-verde-vivo bg-verde-claro ring-2 ring-verde-vivo/25'
                      : 'border-linea bg-white'
                  }`}
                >
                  <span className="text-[22px] leading-none">{c.icono}</span>
                  <span className="w-full truncate text-center text-[11px] font-medium leading-tight">
                    {c.nombre}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setModalCat(true)}
                className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-gris-claro/60 bg-transparent px-1 py-2 text-verde-medio transition active:scale-95"
              >
                <span className="text-[22px] leading-none">+</span>
                <span className="text-center text-[11px] font-medium leading-tight">Nueva</span>
              </button>
            </div>
          </Campo>
        )}

        {tipo === 'abono' && (
          <Campo label="¿A qué deuda?">
            <select
              value={deudaId}
              onChange={(e) => setDeudaId(e.target.value)}
              className="field"
            >
              {vivas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} — {fmt(d.saldo)}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <button onClick={guardar} className="btn-primary mt-1">
          {editando ? 'Guardar cambios' : 'Guardar'}
        </button>

        {editando && (
          <button
            onClick={borrar}
            className="btn-danger mt-2.5"
          >
            Eliminar movimiento
          </button>
        )}
      </div>

      <ModalCategoria
        abierto={modalCat}
        onCerrar={() => setModalCat(false)}
        onCreada={(id) => setCat(id)}
      />
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}
