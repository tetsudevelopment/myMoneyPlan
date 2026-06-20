import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'

const EMOJIS = ['📚', '🎓', '🏠', '🎁', '🐶', '✈️', '🏥', '👕', '🎬', '☕', '🚗', '💼', '🛠️', '💊', '🎵', '🏋️']
const COLORES = ['#1D9E75', '#378ADD', '#BA7517', '#E24B4A', '#7F77DD', '#D4537E', '#0F6E56', '#D85A30', '#993C1D', '#5F5E5A']

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Devuelve el id de la categoría creada (para seleccionarla). */
  onCreada?: (id: string) => void
}

export function ModalCategoria({ abierto, onCerrar, onCreada }: Props) {
  const { agregarCategoria, notificar } = useApp()
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState(EMOJIS[0])
  const [color, setColor] = useState(COLORES[0])

  useEffect(() => {
    if (!abierto) return
    setNombre('')
    setIcono(EMOJIS[0])
    setColor(COLORES[0])
  }, [abierto])

  if (!abierto) return null

  const guardar = () => {
    const nom = nombre.trim()
    if (!nom) return notificar('Ponle un nombre a la categoría')
    const id = agregarCategoria({ nombre: nom, icono, color })
    onCreada?.(id)
    onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end bg-verde-prof/45 lg:items-center lg:justify-center lg:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="mx-auto max-h-[88vh] w-full max-w-app overflow-y-auto rounded-t-[24px] bg-crema px-[18px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[22px] lg:max-w-sm lg:rounded-[24px] lg:pb-[22px] lg:shadow-suave-lg">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-linea lg:hidden" />
        <h3 className="mb-4 text-lg font-bold">Nueva categoría</h3>

        {/* Vista previa */}
        <div className="mb-4 flex items-center gap-3">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
            style={{ background: color + '1A' }}
          >
            {icono}
          </span>
          <div className="text-[15px] font-semibold text-gris">{nombre || 'Nombre…'}</div>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-gris">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Estudio"
          autoFocus
          className="mb-4 w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo"
        />

        <label className="mb-1.5 block text-xs font-semibold text-gris">Ícono</label>
        <div className="mb-4 grid grid-cols-8 gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setIcono(e)}
              className={`grid aspect-square place-items-center rounded-xl text-xl transition ${
                icono === e ? 'bg-verde-claro ring-[1.5px] ring-verde-vivo' : 'bg-white'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-gris">Color</label>
        <div className="mb-5 flex flex-wrap gap-2">
          {COLORES.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              style={{ background: c }}
              className={`h-8 w-8 rounded-full transition ${
                color === c ? 'ring-2 ring-carbon ring-offset-2' : ''
              }`}
            />
          ))}
        </div>

        <button
          onClick={guardar}
          className="w-full rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition active:scale-[.98]"
        >
          Crear categoría
        </button>
      </div>
    </div>
  )
}
