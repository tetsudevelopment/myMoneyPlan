import { InstallBanner } from '../components/InstallBanner'
import { DEUDA_INICIAL_TOTAL } from '../lib/constantes'
import { mesActual } from '../lib/fechas'
import { deudaObjetivo, deudaTotalActual, pctPagadoDeuda, pctPagadoTotal, statsDelMes } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'

export function Inicio({ onAbonar }: { onAbonar: (deudaId: string) => void }) {
  const { estado } = useApp()
  const total = deudaTotalActual(estado.deudas)
  const pct = pctPagadoTotal(estado.deudas)
  const stats = statsDelMes(estado.movimientos, mesActual())
  const objetivo = deudaObjetivo(estado.deudas)

  return (
    <div className="lg:grid lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-5">
      {/* Columna izquierda: hero + stats */}
      <div className="lg:space-y-4">
        <InstallBanner />

        {/* Hero deuda */}
        <section className="mb-4 rounded-hero bg-gradient-to-br from-verde-prof to-verde-medio p-[22px] text-crema shadow-suave-lg lg:mb-0 lg:p-7">
          <p className="text-xs font-medium tracking-wide opacity-70">DEUDA TOTAL RESTANTE</p>
          <p className="my-1 text-[32px] font-bold leading-none tracking-tight lg:text-[40px]">
            {fmt(total)}
          </p>
          <p className="text-[12.5px] opacity-65">de {fmt(DEUDA_INICIAL_TOTAL)} inicial</p>
          <div className="mt-4 h-[7px] overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-verde-vivo transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] opacity-70">
            <span>{pct}% pagado</span>
            <span>Meta: 14 meses</span>
          </div>
        </section>

        {/* Mini stats: 2 en móvil, 4 en tablet+ */}
        <section className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:mb-0">
          <Mini label="Pagado este mes" valor={fmt(stats.pagado)} tono="verde" />
          <Mini label="Gastos del mes" valor={fmt(stats.gastado)} tono="rojo" />
          <Mini label="Ingresos del mes" valor={fmt(stats.ingresado)} />
          <Mini label="Disponible" valor={fmt(stats.disponible)} />
        </section>
      </div>

      {/* Próximo objetivo (columna derecha en desktop) */}
      <section className="rounded-card bg-white p-[18px] shadow-suave lg:sticky lg:top-6">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gris">
          Próximo objetivo
        </h2>
        {objetivo ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-base font-bold">{objetivo.nombre}</div>
                <div className="text-xs text-gris">
                  Tasa {objetivo.tasaEA}% E.A. · Cuota {fmt(objetivo.cuota)}
                </div>
              </div>
              <div className="text-xl font-bold">{fmt(objetivo.saldo)}</div>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-linea">
              <div
                className="h-full rounded-full bg-verde-vivo"
                style={{ width: `${pctPagadoDeuda(objetivo)}%` }}
              />
            </div>
            <button
              onClick={() => onAbonar(objetivo.id)}
              className="mt-3 w-full rounded-[11px] bg-verde-claro py-2.5 text-[13px] font-semibold text-verde-medio transition active:scale-[.98]"
            >
              Registrar abono a esta deuda
            </button>
          </>
        ) : (
          <div className="py-8 text-center text-gris-claro">
            <div className="mb-2 text-4xl">🎉</div>
            <div className="text-[13px]">¡Felicitaciones! No tienes deudas activas.</div>
          </div>
        )}
      </section>
    </div>
  )
}

function Mini({ label, valor, tono }: { label: string; valor: string; tono?: 'verde' | 'rojo' }) {
  const color = tono === 'verde' ? 'text-verde-vivo' : tono === 'rojo' ? 'text-rojo' : ''
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-suave">
      <p className="text-[11px] font-medium text-gris">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tracking-tight ${color}`}>{valor}</p>
    </div>
  )
}
