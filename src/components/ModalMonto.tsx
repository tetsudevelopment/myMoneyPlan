import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { MoneyInput } from './MoneyInput'

interface Props {
  abierto: boolean
  titulo: string
  etiqueta?: string
  confirmar?: string
  onCerrar: () => void
  onConfirmar: (monto: number) => void
}

/** Modal genérico para pedir un monto (aportar, retirar, abonar...). */
export function ModalMonto({ abierto, titulo, etiqueta = 'Monto', confirmar = 'Guardar', onCerrar, onConfirmar }: Props) {
  const { notificar } = useApp()
  const [monto, setMonto] = useState('')

  useEffect(() => {
    if (abierto) setMonto('')
  }, [abierto])

  if (!abierto) return null

  const guardar = () => {
    const v = parseFloat(monto)
    if (!v || v <= 0) return notificar('Ingresa un monto válido')
    onConfirmar(v)
    onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-verde-prof/45 lg:items-center lg:justify-center lg:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="mx-auto w-full max-w-app rounded-t-[24px] bg-crema px-[18px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[22px] lg:max-w-sm lg:rounded-[24px] lg:pb-[22px] lg:shadow-suave-lg">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-linea lg:hidden" />
        <h3 className="mb-4 text-lg font-bold">{titulo}</h3>
        <label className="mb-1.5 block text-xs font-semibold text-gris">{etiqueta}</label>
        <div className="mb-4">
          <MoneyInput value={monto} onChange={setMonto} autoFocus />
        </div>
        <button
          onClick={guardar}
          className="w-full rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition active:scale-[.98]"
        >
          {confirmar}
        </button>
      </div>
    </div>
  )
}
