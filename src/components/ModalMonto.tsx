import { useEffect, useState } from 'react'
import { useEscape } from '../lib/useEscape'
import { useApp } from '../store/AppContext'
import type { Moneda } from '../types'
import { SheetTitulo } from './SheetTitulo'
import { MoneyInput } from './MoneyInput'

interface Props {
  abierto: boolean
  titulo: string
  etiqueta?: string
  confirmar?: string
  moneda?: Moneda
  onCerrar: () => void
  onConfirmar: (monto: number) => void
}

/** Modal genérico para pedir un monto (aportar, retirar, abonar...). */
export function ModalMonto({ abierto, titulo, etiqueta = 'Monto', confirmar = 'Guardar', moneda = 'COP', onCerrar, onConfirmar }: Props) {
  const { notificar } = useApp()
  const [monto, setMonto] = useState('')

  useEffect(() => {
    if (abierto) setMonto('')
  }, [abierto])

  useEscape(abierto, onCerrar)

  if (!abierto) return null

  const guardar = () => {
    const v = parseFloat(monto)
    if (!v || v <= 0) return notificar('Ingresa un monto válido')
    onConfirmar(v)
    onCerrar()
  }

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar}>{titulo}</SheetTitulo>
        <label className="field-label">{etiqueta}</label>
        <div className="mb-5">
          <MoneyInput value={monto} onChange={setMonto} autoFocus moneda={moneda} />
        </div>
        <button
          onClick={guardar}
          className="btn-primary"
        >
          {confirmar}
        </button>
      </div>
    </div>
  )
}
