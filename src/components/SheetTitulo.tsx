import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** Encabezado de sheet: título + botón Cerrar visible. */
export function SheetTitulo({
  onCerrar,
  children,
  className = '',
}: {
  onCerrar: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 ${className}`}>
      <h3 className="sheet-title mb-0">{children}</h3>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="-mr-1.5 -mt-1 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-gris transition hover:bg-white active:scale-95"
      >
        <Icon name="close" className="h-5 w-5" />
      </button>
    </div>
  )
}
