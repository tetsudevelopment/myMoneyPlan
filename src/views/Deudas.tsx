import { DeudaCard } from '../components/DeudaCard'
import { mesActual, nombreMesActual } from '../lib/fechas'
import { deudaObjetivo, deudasVivas } from '../lib/finanzas'
import { fmtK } from '../lib/format'
import { useApp } from '../store/AppContext'

export function Deudas({ onAbonar }: { onAbonar: (deudaId: string) => void }) {
  const { estado, aplicarInteresesMes } = useApp()
  const vivas = deudasVivas(estado.deudas)
  const objetivoId = deudaObjetivo(estado.deudas)?.id
  const ordenadas = [...estado.deudas].sort((a, b) => a.orden - b.orden)
  const cuotaTotal = vivas.reduce((s, d) => s + d.cuota, 0)

  const yaAplicado = estado.interesesAplicados.includes(mesActual())
  const mes = nombreMesActual()

  return (
    <>
      <section className="mb-4 grid grid-cols-2 gap-2.5 sm:max-w-md">
        <Mini label="Deudas activas" valor={String(vivas.length)} />
        <Mini label="Cuota mensual" valor={fmtK(cuotaTotal)} />
      </section>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ordenadas.map((d) => (
          <DeudaCard key={d.id} deuda={d} esObjetivo={d.id === objetivoId} onAbonar={onAbonar} />
        ))}
      </div>

      <div className="md:max-w-lg">
        <button
          onClick={aplicarInteresesMes}
          disabled={yaAplicado}
          className={`w-full rounded-[13px] border-[1.5px] py-3.5 text-sm font-semibold transition ${
            yaAplicado
              ? 'border-[#bfe6d6] bg-verde-claro text-verde-medio'
              : 'border-[#F0D5BC] bg-white text-ambar active:scale-[.99]'
          }`}
        >
          {yaAplicado
            ? `✓ Intereses de ${mes} ya aplicados`
            : `↻ Aplicar intereses de ${mes}`}
        </button>
        <p className="mt-2 px-1 text-center text-[11px] leading-relaxed text-gris-claro">
          {yaAplicado
            ? 'Listo por este mes. Vuelve el próximo mes cuando lleguen tus nuevos extractos.'
            : 'Úsalo una vez al mes, cuando lleguen tus nuevos extractos, para sumar los intereses que cobran los bancos.'}
        </p>
      </div>
    </>
  )
}

function Mini({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-suave">
      <p className="text-[11px] font-medium text-gris">{label}</p>
      <p className="mt-0.5 text-lg font-bold tracking-tight">{valor}</p>
    </div>
  )
}
