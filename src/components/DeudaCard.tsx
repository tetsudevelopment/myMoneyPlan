import { pctPagadoDeuda } from '../lib/finanzas'
import { fmt, fmtK } from '../lib/format'
import type { Deuda } from '../types'
import { Icon } from './Icon'

interface Props {
  deuda: Deuda
  esObjetivo: boolean
  onAbonar: (deudaId: string) => void
  onEditar?: (deuda: Deuda) => void
}

export function DeudaCard({ deuda, esObjetivo, onAbonar, onEditar }: Props) {
  const pagada = deuda.saldo <= 1
  const pct = pctPagadoDeuda(deuda)
  const colorBarra = pagada ? '#1D9E75' : deuda.tipo === 'tarjeta' ? '#E24B4A' : '#378ADD'

  return (
    <div
      className={`relative overflow-hidden rounded-card p-4 shadow-suave ${
        esObjetivo
          ? 'bg-gradient-to-b from-verde-claro/70 to-white ring-2 ring-verde-vivo'
          : 'bg-white'
      } ${pagada ? 'opacity-70' : ''}`}
    >
      {esObjetivo && (
        <span className="mb-2 inline-block rounded-full bg-verde-vivo px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
          ⚡ OBJETIVO ACTUAL
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[16px] font-semibold leading-snug">{deuda.nombre}</div>
          <div className="mt-0.5 text-[12px] text-gris">
            Tasa {deuda.tasaEA}% E.A. · Cuota {fmt(deuda.cuota)}
          </div>
        </div>
        <div className="-mr-1.5 -mt-1.5 flex flex-shrink-0 items-center gap-1">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              pagada
                ? 'bg-verde-claro text-verde-medio'
                : deuda.tipo === 'tarjeta'
                  ? 'bg-rojo-bg text-rojo'
                  : 'bg-[#EAF1FB] text-azul'
            }`}
          >
            {pagada ? '✓ Pagada' : deuda.tipo}
          </span>
          {onEditar && (
            <button
              onClick={() => onEditar(deuda)}
              aria-label="Editar deuda"
              className="btn-icon text-gris-claro"
            >
              <Icon name="edit" className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 text-[26px] font-bold leading-none tracking-tight">
        {fmt(Math.max(0, deuda.saldo))}
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-linea">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: colorBarra }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] text-gris">
        <span>{pct}% pagado</span>
        <span>Inicial: {fmtK(deuda.saldoInicial)}</span>
      </div>

      {!pagada && (
        <button onClick={() => onAbonar(deuda.id)} className="btn-soft mt-3.5 w-full">
          Registrar abono
        </button>
      )}
    </div>
  )
}
