import { GraficoFlujo } from '../components/GraficoFlujo'
import { InstallBanner } from '../components/InstallBanner'
import { mesActual, nombreMesActual } from '../lib/fechas'
import { flujoMensual, statsDelMes } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'

export function Inicio() {
  const { estado } = useApp()
  const stats = statsDelMes(estado.movimientos, mesActual())
  const serie = flujoMensual(estado.movimientos, mesActual(), 6)
  const mes = nombreMesActual()
  const positivo = stats.disponible >= 0

  return (
    <div className="lg:grid lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-5">
      {/* Columna izquierda: balance + gráfico */}
      <div className="lg:space-y-4">
        <InstallBanner />

        {/* Balance del mes */}
        <section className="mb-4 rounded-hero bg-gradient-to-br from-verde-prof to-verde-medio p-[22px] text-crema shadow-suave-lg lg:mb-0 lg:p-7">
          <p className="text-xs font-medium tracking-wide opacity-70">
            DISPONIBLE EN {mes.toUpperCase()}
          </p>
          <p className="my-1 text-[32px] font-bold leading-none tracking-tight lg:text-[40px]">
            {fmt(stats.disponible)}
          </p>
          <p className="text-[12.5px] opacity-65">
            {positivo
              ? 'Te queda margen este mes 👏'
              : 'Cuidado: gastaste más de lo que ingresó 🫣'}
          </p>
        </section>

        {/* Gráfico ingresos vs gastos */}
        <section className="mb-4 rounded-card bg-white p-[18px] shadow-suave lg:mb-0">
          <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-gris">
            Ingresos vs gastos
          </h2>
          <p className="mb-3 text-[11.5px] text-gris-claro">Últimos 6 meses</p>
          <GraficoFlujo datos={serie} />
        </section>
      </div>

      {/* Columna derecha: detalle del mes */}
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
        <Mini label={`Ingresos · ${mes}`} valor={fmt(stats.ingresado)} tono="verde" />
        <Mini label={`Gastos · ${mes}`} valor={fmt(stats.gastado)} tono="rojo" />
        <Mini label="Abonado a deudas" valor={fmt(stats.pagado)} />
        <Mini label="Disponible" valor={fmt(stats.disponible)} tono={positivo ? 'verde' : 'rojo'} />
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
