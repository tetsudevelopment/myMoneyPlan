import { catById } from '../lib/constantes'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Deuda, Movimiento } from '../types'

export function MovimientoItem({
  mov,
  deudas,
  onSelect,
}: {
  mov: Movimiento
  deudas: Deuda[]
  onSelect?: () => void
}) {
  const { estado } = useApp()
  let ico: string
  let color: string
  let etiqueta: string
  let signo: string
  let claseMonto = ''

  if (mov.tipo === 'gasto') {
    const c = catById(mov.cat, estado.categorias)
    ico = c.icono
    color = c.color
    etiqueta = c.nombre
    signo = '−'
  } else if (mov.tipo === 'ingreso') {
    ico = '💰'
    color = '#1D9E75'
    etiqueta = 'Ingreso'
    signo = '+'
    claseMonto = 'text-verde-vivo'
  } else {
    const d = deudas.find((x) => x.id === mov.deudaId)
    ico = '✅'
    color = '#0F6E56'
    etiqueta = 'Abono: ' + (d ? d.nombre : 'deuda')
    signo = '−'
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className="flex w-full items-center gap-3 border-b border-linea py-2.5 text-left transition last:border-b-0 enabled:hover:bg-crema/60 enabled:active:scale-[.995]"
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[19px]"
        style={{ background: color + '1A' }}
      >
        {ico}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{mov.desc || etiqueta}</div>
        <div className="text-[11.5px] text-gris">
          {etiqueta} · <span className="text-[10px] text-gris-claro">{mov.fecha}</span>
        </div>
      </div>
      <div className={`flex-shrink-0 text-[15px] font-semibold ${claseMonto}`}>
        {signo}
        {fmt(mov.monto)}
      </div>
    </button>
  )
}
