import { useEscape } from '../lib/useEscape'

export interface ConfirmOpts {
  titulo: string
  mensaje: string
  /** Texto del botón de confirmar (por defecto "Confirmar"). */
  confirmar?: string
  /** Texto del botón de cancelar (por defecto "Cancelar"). */
  cancelar?: string
  /** Si true, el botón de confirmar se pinta en rojo (acción destructiva). */
  peligroso?: boolean
}

/** Diálogo de confirmación reutilizable. Lo orquesta AppContext.pedirConfirmacion. */
export function ConfirmDialog({
  opts,
  onResponder,
}: {
  opts: ConfirmOpts
  onResponder: (valor: boolean) => void
}) {
  useEscape(true, () => onResponder(false))
  return (
    <div
      className="sheet-overlay z-[160]"
      onClick={(e) => e.target === e.currentTarget && onResponder(false)}
    >
      <div className="sheet">
        <div className="sheet-grab" />
        <h3 className="sheet-title mb-0">{opts.titulo}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-carbon/65">{opts.mensaje}</p>
        <div className="mt-6 flex gap-2.5">
          <button
            onClick={() => onResponder(false)}
            className="btn-secondary flex-1"
          >
            {opts.cancelar ?? 'Cancelar'}
          </button>
          <button
            onClick={() => onResponder(true)}
            className={`btn flex-1 text-white ${opts.peligroso ? 'bg-rojo' : 'bg-verde-prof'}`}
          >
            {opts.confirmar ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
