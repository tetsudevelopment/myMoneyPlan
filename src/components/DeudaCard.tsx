import { pctPagadoDeuda } from '../lib/finanzas'
import { fmt, fmtK } from '../lib/format'
import type { Deuda } from '../types'

interface Props {
  deuda: Deuda
  esObjetivo: boolean
  onAbonar: (deudaId: string) => void
}

export function DeudaCard({ deuda, esObjetivo, onAbonar }: Props) {
  const pagada = deuda.saldo <= 1
  const pct = pctPagadoDeuda(deuda)
  const colorBarra = pagada ? '#1D9E75' : deuda.tipo === 'tarjeta' ? '#E24B4A' : '#378ADD'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white p-[15px] shadow-suave ${
        pagada ? 'opacity-55' : ''
      } ${esObjetivo ? 'border-[1.5px] border-verde-vivo' : ''}`}
    >
      {esObjetivo && <div className="absolute inset-y-0 left-0 w-1 bg-verde-vivo" />}
      {pagada && (
        <span className="absolute right-3.5 top-3 rounded-full bg-verde-claro px-2.5 py-[3px] text-[10px] font-bold text-verde-vivo">
          ✓ PAGADA
        </span>
      )}
      {esObjetivo && (
        <span className="mb-1.5 inline-block rounded-full bg-verde-claro px-2 py-0.5 text-[10px] font-bold text-verde-vivo">
          ⚡ OBJETIVO ACTUAL
        </span>
      )}

      <div className="mb-2.5 flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold">{deuda.nombre}</div>
          <div className="mt-0.5 text-[11.5px] text-gris">
            Tasa {deuda.tasaEA}% E.A. · Cuota {fmt(deuda.cuota)}
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            deuda.tipo === 'tarjeta' ? 'bg-rojo-bg text-rojo' : 'bg-[#EAF1FB] text-azul'
          }`}
        >
          {deuda.tipo}
        </span>
      </div>

      <div className="text-[21px] font-bold tracking-tight">{fmt(Math.max(0, deuda.saldo))}</div>

      <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-linea">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colorBarra }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-gris">
        <span>{pct}% pagado</span>
        <span>Inicial: {fmtK(deuda.saldoInicial)}</span>
      </div>

      {!pagada && (
        <button
          onClick={() => onAbonar(deuda.id)}
          className="mt-3 w-full rounded-[11px] bg-verde-claro py-2.5 text-[13px] font-semibold text-verde-medio transition active:scale-[.98]"
        >
          Registrar abono
        </button>
      )}
    </div>
  )
}
