/** Cifra secundaria con etiqueta. `tono` colorea solo el número. */
export function Stat({
  label,
  valor,
  tono,
}: {
  label: string
  valor: string
  tono?: 'verde' | 'rojo'
}) {
  const color = tono === 'verde' ? 'text-verde-medio' : tono === 'rojo' ? 'text-rojo' : 'text-carbon'
  return (
    <div className="card min-w-0 p-3.5">
      <p className="truncate text-[12px] font-medium text-gris">{label}</p>
      <p className={`mt-1 truncate text-[19px] font-bold leading-tight tracking-tight ${color}`}>
        {valor}
      </p>
    </div>
  )
}
