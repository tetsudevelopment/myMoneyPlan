import type { Vista } from '../App'
import { useApp } from '../store/AppContext'
import { Avatar } from './Avatar'
import { Icon, type IconName } from './Icon'

const TABS: { id: Vista; ico: IconName; lbl: string }[] = [
  { id: 'resumen', ico: 'home', lbl: 'Inicio' },
  { id: 'deudas', ico: 'card', lbl: 'Deudas' },
  { id: 'gastos', ico: 'chart', lbl: 'Gastos' },
  { id: 'plan', ico: 'target', lbl: 'Plan' },
  { id: 'ahorro', ico: 'piggy', lbl: 'Ahorro' },
  { id: 'pareja', ico: 'heart', lbl: 'Pareja' },
]

/** Navegación lateral para desktop (≥ lg). Reemplaza a la barra inferior. */
export function Sidebar({
  activa,
  onCambiar,
  onRegistrar,
}: {
  activa: Vista
  onCambiar: (v: Vista) => void
  onRegistrar: () => void
}) {
  const { perfil, sesionEmail } = useApp()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-linea bg-white px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-verde-prof text-crema"><Icon name="heart" className="h-5 w-5" /></span>
        <div>
          <div className="text-base font-bold leading-none">Mi Plan</div>
          <div className="mt-1 text-[11px] text-gris">Salir de deudas</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onCambiar(t.id)}
            className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
              activa === t.id ? 'bg-verde-claro text-verde-prof' : 'text-gris hover:bg-crema'
            }`}
          >
            <Icon name={t.ico} className="h-5 w-5" />
            {t.lbl}
          </button>
        ))}
      </nav>

      <button
        onClick={onRegistrar}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-verde-vivo py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[.99]"
      >
        <Icon name="plus" className="h-5 w-5" strokeWidth={2.25} /> Registrar
      </button>

      {/* Chip de cuenta → vista Perfil */}
      <button
        onClick={() => onCambiar('perfil')}
        className={`mt-4 flex items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition ${
          activa === 'perfil'
            ? 'border-verde-vivo bg-verde-claro'
            : 'border-linea hover:bg-crema'
        }`}
      >
        <Avatar
          src={perfil.avatar}
          nombre={perfil.nombre}
          email={sesionEmail}
          className="h-9 w-9 flex-shrink-0 rounded-full text-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold">
            {perfil.nombre || sesionEmail || 'Invitado'}
          </div>
          <div className="truncate text-[11px] text-gris">
            {sesionEmail ? 'Ver perfil' : 'Iniciar sesión'}
          </div>
        </div>
      </button>
    </aside>
  )
}
