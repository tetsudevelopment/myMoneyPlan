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
  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-verde-prof/45 lg:items-center lg:justify-center lg:p-6"
      onClick={(e) => e.target === e.currentTarget && onResponder(false)}
    >
      <div className="mx-auto w-full max-w-app rounded-t-[24px] bg-crema px-5 pb-[calc(22px+env(safe-area-inset-bottom))] pt-6 lg:max-w-sm lg:rounded-[24px] lg:pb-6 lg:shadow-suave-lg">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-linea lg:hidden" />
        <h3 className="text-lg font-bold">{opts.titulo}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-gris">{opts.mensaje}</p>
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={() => onResponder(false)}
            className="flex-1 rounded-[13px] border-[1.5px] border-linea bg-white py-3 text-[15px] font-semibold text-gris transition active:scale-[.98]"
          >
            {opts.cancelar ?? 'Cancelar'}
          </button>
          <button
            onClick={() => onResponder(true)}
            className={`flex-1 rounded-[13px] py-3 text-[15px] font-semibold text-white transition active:scale-[.98] ${
              opts.peligroso ? 'bg-rojo' : 'bg-verde-prof'
            }`}
          >
            {opts.confirmar ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
