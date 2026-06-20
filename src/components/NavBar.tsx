import type { Vista } from '../App'

const TABS: { id: Vista; ico: string; lbl: string }[] = [
  { id: 'resumen', ico: '🏠', lbl: 'Inicio' },
  { id: 'deudas', ico: '💳', lbl: 'Deudas' },
  { id: 'gastos', ico: '📊', lbl: 'Gastos' },
  { id: 'plan', ico: '🎯', lbl: 'Plan' },
  { id: 'ahorro', ico: '🐷', lbl: 'Ahorro' },
  { id: 'perfil', ico: '👤', lbl: 'Perfil' },
]

/** Barra de navegación inferior. Solo móvil/tablet; en desktop se usa el Sidebar. */
export function NavBar({ activa, onCambiar }: { activa: Vista; onCambiar: (v: Vista) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-linea bg-white pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div className="mx-auto flex max-w-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onCambiar(t.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors ${
              activa === t.id ? 'text-verde-prof' : 'text-gris-claro'
            }`}
          >
            <span className="text-xl">{t.ico}</span>
            <span className="text-[10px] font-semibold">{t.lbl}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
