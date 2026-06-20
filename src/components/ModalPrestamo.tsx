import { useEffect, useState } from 'react'
import { hoy } from '../lib/fechas'
import { useApp } from '../store/AppContext'
import { MoneyInput } from './MoneyInput'

interface Props {
  abierto: boolean
  onCerrar: () => void
}

/** Registrar un nuevo préstamo (a quién, cuánto, fecha, nota). */
export function ModalPrestamo({ abierto, onCerrar }: Props) {
  const { agregarPrestamo, notificar } = useApp()
  const [persona, setPersona] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [nota, setNota] = useState('')

  useEffect(() => {
    if (!abierto) return
    setPersona('')
    setMonto('')
    setFecha(hoy())
    setNota('')
  }, [abierto])

  if (!abierto) return null

  const guardar = () => {
    const per = persona.trim()
    const v = parseFloat(monto)
    if (!per) return notificar('¿A quién le prestaste?')
    if (!v || v <= 0) return notificar('Ingresa un monto válido')
    agregarPrestamo({ persona: per, monto: v, fecha, nota: nota.trim() || undefined })
    onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-verde-prof/45 lg:items-center lg:justify-center lg:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="mx-auto max-h-[88vh] w-full max-w-app overflow-y-auto rounded-t-[24px] bg-crema px-[18px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[22px] lg:max-w-md lg:rounded-[24px] lg:pb-[22px] lg:shadow-suave-lg">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-linea lg:hidden" />
        <h3 className="mb-4 text-lg font-bold">Nuevo préstamo</h3>

        <Campo label="¿A quién le prestaste?">
          <input
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Nombre de la persona"
            autoFocus
            className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
          />
        </Campo>

        <Campo label="Monto prestado">
          <MoneyInput value={monto} onChange={setMonto} />
        </Campo>

        <Campo label="Fecha">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
          />
        </Campo>

        <Campo label="Nota (opcional)">
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: para el arriendo"
            className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
          />
        </Campo>

        <button
          onClick={guardar}
          className="w-full rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition active:scale-[.98]"
        >
          Registrar préstamo
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
