// Campo de moneda: muestra el valor formateado en pesos (es-CO) con prefijo $
// mientras se escribe. Internamente trabaja con dígitos crudos (sin separadores),
// así el padre puede hacer parseFloat(value) sin problemas.

export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  autoFocus,
  id,
}: {
  /** Dígitos crudos, ej. "50000". */
  value: string
  onChange: (rawDigits: string) => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
}) {
  const formateado = value ? Number(value).toLocaleString('es-CO') : ''
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gris">
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={formateado}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="w-full rounded-xl border-[1.5px] border-linea bg-white py-3 pl-7 pr-3.5 text-base outline-none transition focus:border-verde-vivo focus:ring-4 focus:ring-verde-vivo/15"
      />
    </div>
  )
}
