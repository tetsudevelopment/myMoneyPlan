import { useEffect, useState } from 'react'
import { hoy } from '../lib/fechas'
import { useEscape } from '../lib/useEscape'
import { useApp } from '../store/AppContext'
import { SheetTitulo } from './SheetTitulo'
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

  useEscape(abierto, onCerrar)

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
      className="sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet lg:max-w-md">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar}>Nuevo préstamo</SheetTitulo>

        <Campo label="¿A quién le prestaste?">
          <input
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Nombre de la persona"
            autoFocus
            className="field"
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
            className="field"
          />
        </Campo>

        <Campo label="Nota (opcional)">
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: para el arriendo"
            className="field"
          />
        </Campo>

        <button
          onClick={guardar}
          className="btn-primary"
        >
          Registrar préstamo
        </button>
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
