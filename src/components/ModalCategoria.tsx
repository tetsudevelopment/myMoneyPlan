import { useEffect, useState } from 'react'
import { SheetTitulo } from './SheetTitulo'
import { useEscape } from '../lib/useEscape'
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

  useEscape(abierto, onCerrar)

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
      className="sheet-overlay z-[110]"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar}>Nueva categoría</SheetTitulo>

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

        <label className="field-label">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Estudio"
          autoFocus
          className="mb-4 field"
        />

        <label className="field-label">Ícono</label>
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

        <label className="field-label">Color</label>
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
          className="btn-primary"
        >
          Crear categoría
        </button>
      </div>
    </div>
  )
}
