import { useEffect, useState } from 'react'
import { convertirUSDaCOP, puedeRestar } from '../lib/finanzas'
import { fmt, fmtUSD } from '../lib/format'
import { useEscape } from '../lib/useEscape'
import { useApp } from '../store/AppContext'
import type { Bolsillo } from '../types'
import { SheetTitulo } from './SheetTitulo'
import { MoneyInput } from './MoneyInput'

interface Props {
  /** Bolsillo USD a convertir; null = cerrado. */
  bolsillo: Bolsillo | null
  onCerrar: () => void
}

/** Convierte dólares de un bolsillo USD a pesos (tasa = COP por 1 USD). */
export function ModalConvertir({ bolsillo, onCerrar }: Props) {
  const { convertirBolsilloUSD, notificar } = useApp()
  const [usd, setUsd] = useState('')
  const [tasa, setTasa] = useState('')

  useEffect(() => {
    if (bolsillo) {
      setUsd('')
      setTasa('')
    }
  }, [bolsillo])

  useEscape(!!bolsillo, onCerrar)

  if (!bolsillo) return null

  const montoUSD = parseFloat(usd) || 0
  const tasaNum = parseFloat(tasa) || 0
  const cop = convertirUSDaCOP(montoUSD, tasaNum)

  const confirmar = () => {
    if (montoUSD <= 0) return notificar('Ingresa cuántos dólares convertir')
    if (!puedeRestar([bolsillo], bolsillo.id, montoUSD)) return notificar('No tienes tantos dólares en este bolsillo')
    if (tasaNum <= 0) return notificar('Ingresa la tasa (pesos por dólar)')
    convertirBolsilloUSD(bolsillo.id, montoUSD, tasaNum)
    onCerrar()
  }

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar} className="mb-1">Convertir a pesos</SheetTitulo>
        <p className="mb-5 text-[13px] text-gris">
          {bolsillo.nombre} · disponible {fmtUSD(bolsillo.saldo)}
        </p>

        <label className="field-label">Dólares a convertir</label>
        <div className="mb-4">
          <MoneyInput value={usd} onChange={setUsd} moneda="USD" autoFocus />
        </div>

        <label className="field-label">
          Tasa (pesos por 1 dólar)
        </label>
        <div className="mb-4">
          <MoneyInput value={tasa} onChange={setTasa} placeholder="Ej: 4.100" />
        </div>

        <div className="mb-5 rounded-2xl bg-verde-claro px-4 py-3.5 text-center">
          <div className="text-[12px] font-semibold text-verde-medio">Recibirás</div>
          <div className="text-[26px] font-bold leading-tight tracking-tight text-verde-prof">{fmt(cop)}</div>
        </div>

        <button
          onClick={confirmar}
          className="btn-primary"
        >
          Convertir
        </button>
      </div>
    </div>
  )
}
