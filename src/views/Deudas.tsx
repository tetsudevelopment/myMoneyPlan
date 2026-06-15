import { useState } from 'react'
import { DeudaCard } from '../components/DeudaCard'
import { ModalDeuda } from '../components/ModalDeuda'
import { mesActual, nombreMesActual } from '../lib/fechas'
import {
  deudaInicialTotal,
  deudaObjetivo,
  deudaTotalActual,
  deudasVivas,
  pctPagadoTotal,
} from '../lib/finanzas'
import { fmt, fmtK } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Deuda } from '../types'

export function Deudas({ onAbonar }: { onAbonar: (deudaId: string) => void }) {
  const { estado, aplicarInteresesMes } = useApp()
  const vivas = deudasVivas(estado.deudas)
  const objetivoId = deudaObjetivo(estado.deudas)?.id
  const ordenadas = [...estado.deudas].sort((a, b) => a.orden - b.orden)
  const cuotaTotal = vivas.reduce((s, d) => s + d.cuota, 0)
  const ordenSugerido = (estado.deudas.reduce((m, d) => Math.max(m, d.orden), 0) || 0) + 1

  const yaAplicado = estado.interesesAplicados.includes(mesActual())
  const mes = nombreMesActual()

  const [modal, setModal] = useState(false)
  const [editar, setEditar] = useState<Deuda | null>(null)

  const abrirNueva = () => {
    setEditar(null)
    setModal(true)
  }
  const abrirEditar = (d: Deuda) => {
    setEditar(d)
    setModal(true)
  }

  const totalRestante = deudaTotalActual(estado.deudas)
  const totalInicial = deudaInicialTotal(estado.deudas)
  const pctTotal = pctPagadoTotal(estado.deudas)

  return (
    <>
      {estado.deudas.length > 0 && (
        <section className="mb-4 rounded-hero bg-gradient-to-br from-verde-prof to-verde-medio p-[22px] text-crema shadow-suave-lg lg:p-7">
          <p className="text-xs font-medium tracking-wide opacity-70">DEUDA TOTAL RESTANTE</p>
          <p className="my-1 text-[32px] font-bold leading-none tracking-tight lg:text-[40px]">
            {fmt(totalRestante)}
          </p>
          <p className="text-[12.5px] opacity-65">de {fmt(totalInicial)} inicial</p>
          <div className="mt-4 h-[7px] overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-verde-vivo transition-all duration-700"
              style={{ width: `${pctTotal}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] opacity-70">
            <span>{pctTotal}% pagado</span>
            <span>
              {vivas.length} {vivas.length === 1 ? 'deuda activa' : 'deudas activas'}
            </span>
          </div>
        </section>
      )}

      <section className="mb-4 grid grid-cols-2 gap-2.5 sm:max-w-md">
        <Mini label="Deudas activas" valor={String(vivas.length)} />
        <Mini label="Cuota mensual" valor={fmtK(cuotaTotal)} />
      </section>

      {estado.deudas.length === 0 ? (
        <div className="rounded-card bg-white px-6 py-10 text-center shadow-suave">
          <div className="mb-2 text-4xl">💳</div>
          <div className="text-[14px] font-semibold">Aún no tienes deudas</div>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-gris">
            Agrega tus deudas para armar tu plan de pago.
          </p>
          <button
            onClick={abrirNueva}
            className="mt-4 rounded-[13px] bg-verde-prof px-5 py-3 text-sm font-semibold text-crema"
          >
            + Agregar deuda
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ordenadas.map((d) => (
              <DeudaCard
                key={d.id}
                deuda={d}
                esObjetivo={d.id === objetivoId}
                onAbonar={onAbonar}
                onEditar={abrirEditar}
              />
            ))}
          </div>

          <button
            onClick={abrirNueva}
            className="mb-4 w-full rounded-[13px] border-[1.5px] border-dashed border-linea bg-white py-3 text-sm font-semibold text-verde-medio transition active:scale-[.99] md:max-w-xs"
          >
            + Agregar deuda
          </button>

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
              {yaAplicado ? `✓ Intereses de ${mes} ya aplicados` : `↻ Aplicar intereses de ${mes}`}
            </button>
            <p className="mt-2 px-1 text-center text-[11px] leading-relaxed text-gris-claro">
              {yaAplicado
                ? 'Listo por este mes. Vuelve el próximo mes cuando lleguen tus nuevos extractos.'
                : 'Úsalo una vez al mes, cuando lleguen tus nuevos extractos, para sumar los intereses que cobran los bancos.'}
            </p>
          </div>
        </>
      )}

      <ModalDeuda
        abierto={modal}
        onCerrar={() => setModal(false)}
        deudaEditar={editar}
        ordenSugerido={ordenSugerido}
      />
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
