import { useState } from 'react'
import { ModalRegistro } from './components/ModalRegistro'
import { NavBar } from './components/NavBar'
import { Sidebar } from './components/Sidebar'
import { AppProvider } from './store/AppContext'
import { Deudas } from './views/Deudas'
import { Gastos } from './views/Gastos'
import { Inicio } from './views/Inicio'
import { Perfil } from './views/Perfil'
import { Plan } from './views/Plan'

export type Vista = 'resumen' | 'deudas' | 'gastos' | 'plan' | 'perfil'

const TITULOS: Record<Vista, [string, string]> = {
  resumen: ['Resumen', 'Tu camino a cero deudas'],
  deudas: ['Mis deudas', 'Ordenadas por estrategia de pago'],
  gastos: ['Gastos', '¿En qué se va tu dinero?'],
  plan: ['Mi plan', '14 meses para ser libre'],
  perfil: ['Mi perfil', 'Tu cuenta y preferencias'],
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

function Shell() {
  const [vista, setVista] = useState<Vista>('resumen')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [abonoDeudaId, setAbonoDeudaId] = useState<string | null>(null)

  const abrirRegistro = () => {
    setAbonoDeudaId(null)
    setModalAbierto(true)
  }
  const abrirAbono = (deudaId: string) => {
    setAbonoDeudaId(deudaId)
    setModalAbierto(true)
  }
  const irA = (v: Vista) => {
    setVista(v)
    try {
      window.scrollTo(0, 0)
    } catch {
      /* jsdom u otros entornos sin scrollTo */
    }
  }

  const [titulo, sub] = TITULOS[vista]

  return (
    <div className="lg:flex lg:bg-crema">
      {/* Navegación lateral (desktop) */}
      <Sidebar activa={vista} onCambiar={irA} onRegistrar={abrirRegistro} />

      {/* Columna principal */}
      <div className="relative mx-auto min-h-screen w-full max-w-app pb-[calc(72px+env(safe-area-inset-bottom))] lg:max-w-none lg:flex-1 lg:pb-0">
        <header className="relative overflow-hidden bg-verde-prof px-5 pb-[22px] pt-[calc(env(safe-area-inset-top)+18px)] text-crema lg:px-8 lg:pb-7 lg:pt-7">
          <div className="lg:mx-auto lg:max-w-5xl">
            <h1 className="text-sm font-medium tracking-wide opacity-75 lg:text-base">{titulo}</h1>
            <p className="mt-0.5 text-xs opacity-55 lg:text-sm">{sub}</p>
          </div>
        </header>

        <main className="px-4 pb-6 pt-[18px] lg:px-8 lg:pb-12 lg:pt-8">
          <div className="lg:mx-auto lg:max-w-5xl">
            {vista === 'resumen' && <Inicio onAbonar={abrirAbono} />}
            {vista === 'deudas' && <Deudas onAbonar={abrirAbono} />}
            {vista === 'gastos' && <Gastos />}
            {vista === 'plan' && <Plan />}
            {vista === 'perfil' && <Perfil />}
          </div>
        </main>

        {/* FAB (móvil/tablet) — oculto en Perfil */}
        {vista !== 'perfil' && (
          <button
            onClick={abrirRegistro}
            aria-label="Registrar movimiento"
            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-verde-vivo text-[28px] text-white shadow-[0_6px_20px_rgba(29,158,117,0.4)] transition active:scale-90 sm:right-6 lg:hidden"
          >
            +
          </button>
        )}

        {/* Barra inferior (móvil/tablet) */}
        <NavBar activa={vista} onCambiar={irA} />
      </div>

      <ModalRegistro
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        abonoDeudaId={abonoDeudaId}
      />
    </div>
  )
}
