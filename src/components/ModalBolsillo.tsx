import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { Bolsillo } from '../types'
import { MoneyInput } from './MoneyInput'

interface Props {
  abierto: boolean
  onCerrar: () => void
  bolsilloEditar?: Bolsillo | null
}

/** Crear un bolsillo (nombre + saldo inicial) o renombrar uno existente. */
export function ModalBolsillo({ abierto, onCerrar, bolsilloEditar }: Props) {
  const { agregarBolsillo, editarBolsillo, notificar } = useApp()
  const editando = !!bolsilloEditar
  const [nombre, setNombre] = useState('')
  const [saldo, setSaldo] = useState('')

  useEffect(() => {
    if (!abierto) return
    setNombre(bolsilloEditar?.nombre ?? '')
    setSaldo('')
  }, [abierto, bolsilloEditar])

  if (!abierto) return null

  const guardar = () => {
    const nom = nombre.trim()
    if (!nom) return notificar('Ponle un nombre al bolsillo')
    if (editando && bolsilloEditar) {
      editarBolsillo(bolsilloEditar.id, nom)
    } else {
      agregarBolsillo(nom, parseFloat(saldo) || 0)
    }
    onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-verde-prof/45 lg:items-center lg:justify-center lg:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="mx-auto w-full max-w-app rounded-t-[24px] bg-crema px-[18px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[22px] lg:max-w-sm lg:rounded-[24px] lg:pb-[22px] lg:shadow-suave-lg">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-linea lg:hidden" />
        <h3 className="mb-4 text-lg font-bold">{editando ? 'Renombrar bolsillo' : 'Nuevo bolsillo'}</h3>

        <label className="mb-1.5 block text-xs font-semibold text-gris">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Fondo de emergencia, Viaje..."
          autoFocus
          className="mb-3.5 w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
        />

        {!editando && (
          <>
            <label className="mb-1.5 block text-xs font-semibold text-gris">Saldo inicial</label>
            <div className="mb-4">
              <MoneyInput value={saldo} onChange={setSaldo} />
            </div>
          </>
        )}

        <button
          onClick={guardar}
          className="w-full rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition active:scale-[.98]"
        >
          {editando ? 'Guardar' : 'Crear bolsillo'}
        </button>
      </div>
    </div>
  )
}
