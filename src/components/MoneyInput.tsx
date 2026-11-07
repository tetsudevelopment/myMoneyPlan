// Campo de moneda: muestra el valor formateado mientras se escribe.
// - COP (por defecto): pesos es-CO con prefijo $, solo enteros.
// - USD: prefijo US$, formato en-US y hasta 2 decimales.
// Internamente trabaja con un string crudo ("50000" o "1234.5") para que el
// padre pueda hacer parseFloat(value) sin problemas.

import type { Moneda } from '../types'

/** Limpia lo escrito a un string numérico crudo según la moneda. */
export function limpiarMonto(texto: string, moneda: Moneda): string {
  if (moneda === 'COP') return texto.replace(/\D/g, '')
  const limpio = texto.replace(/[^\d.]/g, '')
  const [ent, ...resto] = limpio.split('.')
  if (resto.length === 0) return ent
  return `${ent}.${resto.join('').slice(0, 2)}`
}

/** Valor crudo -> texto con separadores de miles (conserva el punto/decimales). */
export function formatearMonto(value: string, moneda: Moneda): string {
  if (!value) return ''
  if (moneda === 'COP') return Number(value).toLocaleString('es-CO')
  const [ent, dec] = value.split('.')
  const entFmt = ent ? Number(ent).toLocaleString('en-US') : '0'
  return dec === undefined ? entFmt : `${entFmt}.${dec}`
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  autoFocus,
  id,
  moneda = 'COP',
}: {
  /** Valor crudo, ej. "50000" (COP) o "1234.5" (USD). */
  value: string
  onChange: (raw: string) => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
  moneda?: Moneda
}) {
  const usd = moneda === 'USD'
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gris">
        {usd ? 'US$' : '$'}
      </span>
      <input
        id={id}
        type="text"
        inputMode={usd ? 'decimal' : 'numeric'}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={formatearMonto(value, moneda)}
        onChange={(e) => onChange(limpiarMonto(e.target.value.replace(/,/g, ''), moneda))}
        className={`field pr-3.5 text-[18px] font-semibold ${usd ? 'pl-12' : 'pl-8'}`}
      />
    </div>
  )
}
