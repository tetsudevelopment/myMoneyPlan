import { useState } from 'react'
import { ModalBolsillo } from '../components/ModalBolsillo'
import { ModalMonto } from '../components/ModalMonto'
import { ModalPrestamo } from '../components/ModalPrestamo'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Bolsillo } from '../types'

type Tab = 'ahorro' | 'prestado'

export function Ahorro() {
  const { estado, ajustarBolsillo, eliminarBolsillo, abonarPrestamo, eliminarPrestamo } = useApp()
  const [tab, setTab] = useState<Tab>('ahorro')

  // Modales
  const [modalBolsillo, setModalBolsillo] = useState(false)
  const [editarBolsilloObj, setEditarBolsilloObj] = useState<Bolsillo | null>(null)
  const [modalPrestamo, setModalPrestamo] = useState(false)
  const [montoAccion, setMontoAccion] = useState<{
    titulo: string
    confirmar: string
    onOk: (m: number) => void
  } | null>(null)

  const totalAhorro = estado.bolsillos.reduce((s, b) => s + b.saldo, 0)
  const totalPorCobrar = estado.prestamos.reduce((s, p) => s + Math.max(0, p.monto - p.abonado), 0)

  return (
    <>
      {/* Tabs */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white p-1 shadow-suave md:max-w-sm">
        <TabBtn activo={tab === 'ahorro'} onClick={() => setTab('ahorro')}>
          🐷 Ahorro
        </TabBtn>
        <TabBtn activo={tab === 'prestado'} onClick={() => setTab('prestado')}>
          🤝 Prestado
        </TabBtn>
      </div>

      {tab === 'ahorro' ? (
        <>
          <Hero label="TOTAL AHORRADO" valor={fmt(totalAhorro)} />

          {estado.bolsillos.length === 0 ? (
            <Vacio
              ico="🐷"
              titulo="Sin bolsillos todavía"
              texto="Crea un bolsillo para empezar a ahorrar."
            />
          ) : (
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {estado.bolsillos.map((b) => (
                <div key={b.id} className="rounded-card bg-white p-[15px] shadow-suave">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{b.nombre}</div>
                      <div className="mt-0.5 text-[21px] font-bold tracking-tight">{fmt(b.saldo)}</div>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                      <IconBtn label="Renombrar" onClick={() => setEditarBolsilloObj(b)}>✏️</IconBtn>
                      <IconBtn label="Eliminar" onClick={() => void eliminarBolsillo(b.id)}>🗑️</IconBtn>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setMontoAccion({
                          titulo: `Aportar a ${b.nombre}`,
                          confirmar: 'Aportar',
                          onOk: (m) => ajustarBolsillo(b.id, m),
                        })
                      }
                      className="rounded-[11px] bg-verde-claro py-2.5 text-[13px] font-semibold text-verde-medio transition active:scale-[.98]"
                    >
                      + Aportar
                    </button>
                    <button
                      onClick={() =>
                        setMontoAccion({
                          titulo: `Retirar de ${b.nombre}`,
                          confirmar: 'Retirar',
                          onOk: (m) => ajustarBolsillo(b.id, -m),
                        })
                      }
                      className="rounded-[11px] bg-crema py-2.5 text-[13px] font-semibold text-gris transition active:scale-[.98]"
                    >
                      − Retirar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <BotonNuevo onClick={() => setModalBolsillo(true)}>+ Nuevo bolsillo</BotonNuevo>
        </>
      ) : (
        <>
          <Hero label="TOTAL POR COBRAR" valor={fmt(totalPorCobrar)} />

          {estado.prestamos.length === 0 ? (
            <Vacio
              ico="🤝"
              titulo="Sin préstamos registrados"
              texto="Registra el dinero que prestaste para no perderle el rastro."
            />
          ) : (
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {estado.prestamos.map((p) => {
                const pendiente = Math.max(0, p.monto - p.abonado)
                const pagado = pendiente <= 0
                const pct = p.monto > 0 ? Math.round((p.abonado / p.monto) * 100) : 0
                return (
                  <div
                    key={p.id}
                    className={`rounded-card bg-white p-[15px] shadow-suave ${pagado ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold">{p.persona}</div>
                        <div className="mt-0.5 text-[11.5px] text-gris">
                          {p.nota ? `${p.nota} · ` : ''}
                          {p.fecha}
                        </div>
                      </div>
                      <IconBtn label="Eliminar" onClick={() => void eliminarPrestamo(p.id)}>🗑️</IconBtn>
                    </div>

                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-gris-claro">
                          {pagado ? 'Pagado' : 'Te debe'}
                        </div>
                        <div className="text-[21px] font-bold tracking-tight">
                          {pagado ? fmt(p.monto) : fmt(pendiente)}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-gris">de {fmt(p.monto)}</div>
                    </div>

                    <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-linea">
                      <div className="h-full rounded-full bg-verde-vivo" style={{ width: `${pct}%` }} />
                    </div>

                    {pagado ? (
                      <div className="mt-3 rounded-[11px] bg-verde-claro py-2 text-center text-[12px] font-semibold text-verde-medio">
                        ✓ Te pagó todo
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setMontoAccion({
                            titulo: `Abono de ${p.persona}`,
                            confirmar: 'Registrar abono',
                            onOk: (m) => abonarPrestamo(p.id, m),
                          })
                        }
                        className="mt-3 w-full rounded-[11px] bg-verde-claro py-2.5 text-[13px] font-semibold text-verde-medio transition active:scale-[.98]"
                      >
                        Registrar abono
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <BotonNuevo onClick={() => setModalPrestamo(true)}>+ Nuevo préstamo</BotonNuevo>
        </>
      )}

      {/* Modales */}
      <ModalBolsillo
        abierto={modalBolsillo || !!editarBolsilloObj}
        bolsilloEditar={editarBolsilloObj}
        onCerrar={() => {
          setModalBolsillo(false)
          setEditarBolsilloObj(null)
        }}
      />
      <ModalPrestamo abierto={modalPrestamo} onCerrar={() => setModalPrestamo(false)} />
      <ModalMonto
        abierto={!!montoAccion}
        titulo={montoAccion?.titulo ?? ''}
        confirmar={montoAccion?.confirmar}
        onConfirmar={(m) => montoAccion?.onOk(m)}
        onCerrar={() => setMontoAccion(null)}
      />
    </>
  )
}

function TabBtn({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg py-2.5 text-sm font-semibold transition ${
        activo ? 'bg-verde-prof text-crema' : 'text-gris'
      }`}
    >
      {children}
    </button>
  )
}

function Hero({ label, valor }: { label: string; valor: string }) {
  return (
    <section className="mb-4 rounded-hero bg-gradient-to-br from-verde-prof to-verde-medio p-[22px] text-crema shadow-suave-lg lg:p-7">
      <p className="text-xs font-medium tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-[32px] font-bold leading-none tracking-tight lg:text-[40px]">{valor}</p>
    </section>
  )
}

function Vacio({ ico, titulo, texto }: { ico: string; titulo: string; texto: string }) {
  return (
    <div className="mb-4 rounded-card bg-white px-6 py-10 text-center shadow-suave">
      <div className="mb-2 text-4xl">{ico}</div>
      <div className="text-[14px] font-semibold">{titulo}</div>
      <p className="mx-auto mt-1 max-w-xs text-[13px] text-gris">{texto}</p>
    </div>
  )
}

function BotonNuevo({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[13px] border-[1.5px] border-dashed border-linea bg-white py-3 text-sm font-semibold text-verde-medio transition active:scale-[.99] md:max-w-xs"
    >
      {children}
    </button>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-lg text-[13px] text-gris-claro transition hover:bg-crema"
    >
      {children}
    </button>
  )
}
