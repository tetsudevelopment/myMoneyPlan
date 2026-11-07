import { catById } from '../lib/constantes'
import { fmt, fmtUSD } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Deuda, Movimiento } from '../types'
import { Icon, type IconName } from './Icon'

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
  let ico: string | IconName
  let esIcono = false
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
    ico = 'down'
    esIcono = true
    color = '#1D9E75'
    etiqueta = 'Ingreso'
    signo = '+'
    claseMonto = 'text-verde-medio'
  } else {
    const d = deudas.find((x) => x.id === mov.deudaId)
    ico = 'check'
    esIcono = true
    color = '#0F6E56'
    etiqueta = 'Abono: ' + (d ? d.nombre : 'deuda')
    signo = '−'
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className="flex min-h-[64px] w-full items-center gap-3 border-b border-linea py-2.5 text-left transition last:border-b-0 enabled:active:bg-crema"
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] text-[20px]"
        style={{ background: color + '1A', color }}
      >
        {esIcono ? <Icon name={ico as IconName} className="h-5 w-5" strokeWidth={2} /> : ico}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium leading-snug">{mov.desc || etiqueta}</div>
        <div className="truncate text-[12px] text-gris">
          {etiqueta} · {mov.fecha}
        </div>
      </div>
      <div className={`flex-shrink-0 text-[15px] font-semibold ${claseMonto}`}>
        {signo}
        {mov.moneda === 'USD' ? fmtUSD(mov.monto) : fmt(mov.monto)}
        {mov.moneda === 'USD' && <BadgeUSD />}
      </div>
    </button>
  )
}

function BadgeUSD() {
  return (
    <span className="ml-1.5 rounded-md bg-azul/15 px-1.5 py-0.5 align-middle text-[10px] font-bold text-azul">
      USD
    </span>
  )
}
