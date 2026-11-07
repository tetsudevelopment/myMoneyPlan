import { useEffect, useState } from 'react'
import { ENTIDADES, ENTIDAD_OTRA, esEntidadConocida } from '../lib/entidades'
import { useEscape } from '../lib/useEscape'
import { useApp } from '../store/AppContext'
import type { Bolsillo, Moneda } from '../types'
import { SheetTitulo } from './SheetTitulo'
import { MoneyInput } from './MoneyInput'

interface Props {
  abierto: boolean
  onCerrar: () => void
  bolsilloEditar?: Bolsillo | null
}

/** Crear un bolsillo (nombre, moneda, entidad, saldo inicial) o editar nombre/entidad. */
export function ModalBolsillo({ abierto, onCerrar, bolsilloEditar }: Props) {
  const { agregarBolsillo, editarBolsillo, notificar } = useApp()
  const editando = !!bolsilloEditar
  const [nombre, setNombre] = useState('')
  const [saldo, setSaldo] = useState('')
  const [moneda, setMoneda] = useState<Moneda>('COP')
  const [entidadSel, setEntidadSel] = useState('')
  const [entidadOtra, setEntidadOtra] = useState('')

  useEffect(() => {
    if (!abierto) return
    setNombre(bolsilloEditar?.nombre ?? '')
    setSaldo('')
    setMoneda(bolsilloEditar?.moneda ?? 'COP')
    const e = bolsilloEditar?.entidad ?? ''
    // Una entidad guardada que no está en la lista se muestra como "Otra".
    if (!e) {
      setEntidadSel('')
      setEntidadOtra('')
    } else if (esEntidadConocida(e) || e === 'Efectivo') {
      setEntidadSel(e)
      setEntidadOtra('')
    } else {
      setEntidadSel(ENTIDAD_OTRA)
      setEntidadOtra(e)
    }
  }, [abierto, bolsilloEditar])

  useEscape(abierto, onCerrar)

  if (!abierto) return null

  const guardar = () => {
    const nom = nombre.trim()
    if (!nom) return notificar('Ponle un nombre al bolsillo')
    const entidad = entidadSel === ENTIDAD_OTRA ? entidadOtra.trim() : entidadSel
    if (editando && bolsilloEditar) {
      editarBolsillo(bolsilloEditar.id, { nombre: nom, entidad })
    } else {
      agregarBolsillo({ nombre: nom, saldo: parseFloat(saldo) || 0, moneda, entidad })
    }
    onCerrar()
  }

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar}>{editando ? 'Editar bolsillo' : 'Nuevo bolsillo'}</SheetTitulo>

        <label className="field-label">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Fondo de emergencia, Viaje..."
          autoFocus
          className="mb-4 field"
        />

        {!editando && (
          <>
            <label className="field-label">Moneda</label>
            <div className="seg mb-4">
              {(['COP', 'USD'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMoneda(m)
                    setSaldo('')
                  }}
                  aria-pressed={moneda === m}
                  className="seg-btn"
                >
                  {m === 'COP' ? 'Pesos (COP)' : 'Dólares (USD)'}
                </button>
              ))}
            </div>
          </>
        )}

        <label htmlFor="bolsillo-entidad" className="field-label">Entidad (opcional)</label>
        <select
          id="bolsillo-entidad"
          value={entidadSel}
          onChange={(e) => setEntidadSel(e.target.value)}
          className={`field ${
            entidadSel === ENTIDAD_OTRA ? 'mb-2' : 'mb-4'
          }`}
        >
          <option value="">Sin entidad</option>
          {ENTIDADES.map((g) => (
            <optgroup key={g.grupo} label={g.grupo}>
              {g.entidades.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {entidadSel === ENTIDAD_OTRA && (
          <input
            value={entidadOtra}
            onChange={(e) => setEntidadOtra(e.target.value)}
            aria-label="Nombre de la entidad"
            placeholder="¿Cuál entidad?"
            className="mb-4 field"
          />
        )}

        {!editando && (
          <>
            <label htmlFor="bolsillo-saldo" className="field-label">Saldo inicial</label>
            <div className="mb-5">
              <MoneyInput id="bolsillo-saldo" value={saldo} onChange={setSaldo} moneda={moneda} />
            </div>
          </>
        )}

        <button
          onClick={guardar}
          className="btn-primary"
        >
          {editando ? 'Guardar' : 'Crear bolsillo'}
        </button>
      </div>
    </div>
  )
}
