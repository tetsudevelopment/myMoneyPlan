// Formateadores de moneda (es-CO), tomados del prototipo.

/** $1.234.567 */
export const fmt = (n: number): string => '$' + Math.round(n).toLocaleString('es-CO')

/** Versión compacta: $1.2M / $250k / $900 */
export const fmtK = (n: number): string => {
  const v = Math.round(n)
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return '$' + Math.round(v / 1_000) + 'k'
  return '$' + v
}
