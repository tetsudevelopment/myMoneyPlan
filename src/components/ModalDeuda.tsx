import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { Deuda, TipoDeuda } from '../types'

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
      className="fixed inset-0 z-[100] flex items-end bg-verde-prof/45 lg:items-center lg:justify-center lg:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="mx-auto max-h-[88vh] w-full max-w-app overflow-y-auto rounded-t-[24px] bg-crema px-[18px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[22px] lg:max-w-md lg:rounded-[24px] lg:pb-[22px] lg:shadow-suave-lg">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-linea lg:hidden" />
        <h3 className="mb-4 text-lg font-bold">{editando ? 'Editar deuda' : 'Nueva deuda'}</h3>

        <Campo label="Nombre">
          <Input value={nombre} onChange={setNombre} placeholder="Ej: Tarjeta Visa, Préstamo..." />
        </Campo>

        <Campo label="Tipo">
          <div className="flex gap-2">
            {(['tarjeta', 'credito'] as TipoDeuda[]).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-xl border-[1.5px] py-2.5 text-sm font-semibold capitalize transition ${
                  tipo === t
                    ? 'border-verde-prof bg-verde-prof text-crema'
                    : 'border-linea bg-white text-gris'
                }`}
              >
                {t === 'tarjeta' ? 'Tarjeta' : 'Crédito'}
              </button>
            ))}
          </div>
        </Campo>

        <Campo label={editando ? 'Saldo actual' : 'Saldo que debes hoy'}>
          <Input value={saldo} onChange={setSaldo} placeholder="0" type="number" inputMode="numeric" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Tasa % E.A.">
            <Input value={tasaEA} onChange={setTasaEA} placeholder="24.33" type="number" inputMode="decimal" />
          </Campo>
          <Campo label="Cuota mensual">
            <Input value={cuota} onChange={setCuota} placeholder="0" type="number" inputMode="numeric" />
          </Campo>
        </div>

        <Campo label="Orden de ataque (1 = pagar primero)">
          <Input value={orden} onChange={setOrden} placeholder="1" type="number" inputMode="numeric" />
        </Campo>

        <button
          onClick={guardar}
          className="mt-1 w-full rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition active:scale-[.98]"
        >
          {editando ? 'Guardar cambios' : 'Agregar deuda'}
        </button>

        {editando && (
          <button
            onClick={borrar}
            className="mt-2.5 w-full rounded-[13px] border-[1.5px] border-linea bg-white py-3 text-sm font-semibold text-rojo transition active:scale-[.98]"
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
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-semibold text-gris">{label}</label>
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
      className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none transition focus:border-verde-vivo focus:ring-4 focus:ring-verde-vivo/15"
    />
  )
}
