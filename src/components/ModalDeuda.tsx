import { useEffect, useState } from 'react'
import { useEscape } from '../lib/useEscape'
import { useApp } from '../store/AppContext'
import type { Deuda, TipoDeuda } from '../types'
import { SheetTitulo } from './SheetTitulo'
import { MoneyInput } from './MoneyInput'

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Si viene, el modal edita esa deuda; si no, crea una nueva. */
  deudaEditar?: Deuda | null
  /** Orden sugerido para una deuda nueva. */
  ordenSugerido?: number
}

export function ModalDeuda({ abierto, onCerrar, deudaEditar, ordenSugerido = 1 }: Props) {
  const { agregarDeuda, editarDeuda, eliminarDeuda, notificar } = useApp()
  const editando = !!deudaEditar

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoDeuda>('tarjeta')
  const [saldo, setSaldo] = useState('')
  const [tasaEA, setTasaEA] = useState('')
  const [cuota, setCuota] = useState('')
  const [orden, setOrden] = useState('')

  useEffect(() => {
    if (!abierto) return
    if (deudaEditar) {
      setNombre(deudaEditar.nombre)
      setTipo(deudaEditar.tipo)
      setSaldo(String(Math.round(deudaEditar.saldo)))
      setTasaEA(String(deudaEditar.tasaEA))
      setCuota(String(Math.round(deudaEditar.cuota)))
      setOrden(String(deudaEditar.orden))
    } else {
      setNombre('')
      setTipo('tarjeta')
      setSaldo('')
      setTasaEA('')
      setCuota('')
      setOrden(String(ordenSugerido))
    }
  }, [abierto, deudaEditar, ordenSugerido])

  useEscape(abierto, onCerrar)

  if (!abierto) return null

  const guardar = () => {
    const nom = nombre.trim()
    const nSaldo = parseFloat(saldo)
    const nTasa = parseFloat(tasaEA)
    const nCuota = parseFloat(cuota) || 0
    const nOrden = parseInt(orden, 10) || ordenSugerido
    if (!nom) return notificar('Ponle un nombre a la deuda')
    if (!nSaldo || nSaldo <= 0) return notificar('Ingresa un saldo válido')
    if (isNaN(nTasa) || nTasa < 0) return notificar('Ingresa la tasa E.A. (ej. 24.33)')

    if (deudaEditar) {
      editarDeuda(deudaEditar.id, {
        nombre: nom,
        tipo,
        saldo: nSaldo,
        tasaEA: nTasa,
        cuota: nCuota,
        orden: nOrden,
      })
    } else {
      agregarDeuda({
        nombre: nom,
        tipo,
        saldoInicial: nSaldo,
        saldo: nSaldo,
        tasaEA: nTasa,
        cuota: nCuota,
        orden: nOrden,
      })
    }
    onCerrar()
  }

  const borrar = async () => {
    if (!deudaEditar) return
    onCerrar()
    await eliminarDeuda(deudaEditar.id)
  }

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet lg:max-w-md">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar}>{editando ? 'Editar deuda' : 'Nueva deuda'}</SheetTitulo>

        <Campo label="Nombre">
          <Input value={nombre} onChange={setNombre} placeholder="Ej: Tarjeta Visa, Préstamo..." />
        </Campo>

        <Campo label="Tipo">
          <div className="seg">
            {(['tarjeta', 'credito'] as TipoDeuda[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                aria-pressed={tipo === t}
                className="seg-btn"
              >
                {t === 'tarjeta' ? 'Tarjeta' : 'Crédito'}
              </button>
            ))}
          </div>
        </Campo>

        <Campo label={editando ? 'Saldo actual' : 'Saldo que debes hoy'}>
          <MoneyInput value={saldo} onChange={setSaldo} />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Tasa % E.A.">
            <Input value={tasaEA} onChange={setTasaEA} placeholder="24.33" type="number" inputMode="decimal" />
          </Campo>
          <Campo label="Cuota mensual">
            <MoneyInput value={cuota} onChange={setCuota} />
          </Campo>
        </div>

        <Campo label="Orden de ataque (1 = pagar primero)">
          <Input value={orden} onChange={setOrden} placeholder="1" type="number" inputMode="numeric" />
        </Campo>

        <button
          onClick={guardar}
          className="mt-1 btn-primary"
        >
          {editando ? 'Guardar cambios' : 'Agregar deuda'}
        </button>

        {editando && (
          <button
            onClick={borrar}
            className="btn-danger mt-2.5"
          >
            Eliminar deuda
          </button>
        )}
      </div>
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

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="field"
    />
  )
}
