// Set de íconos propio (SVG inline, trazo 1.75, 24x24). Sin dependencias.
// Un solo estilo para toda la app: reemplaza a los emojis en navegación y acciones.

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  card: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 3h18M7 15h3',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  piggy:
    'M19 10.5V9a1 1 0 0 0-1-1h-.6A6.5 6.5 0 0 0 11.5 5C8 5 5 7.7 5 11c0 1.7.8 3.2 2 4.2V19h3v-1.5h4V19h3v-3.3c1-.7 1.7-1.7 2-2.7h1v-3h-1ZM15 11.5h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8.5a7 7 0 0 1 14 0',
  heart:
    'M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10Z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Zm9-13 4 4',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  down: 'M17 7 7 17m0 0h8m-8 0V9',
  up: 'M7 17 17 7m0 0H9m8 0v8',
  hand: 'M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a5 5 0 0 1-4-2l-3-4.5a1.5 1.5 0 0 1 2.4-1.8L8 14',
  bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z',
  refresh: 'M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4',
  note: 'M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 9h6m-6 4h6',
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  className = 'h-6 w-6',
  strokeWidth = 1.75,
}: {
  name: IconName
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
