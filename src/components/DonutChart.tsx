import { useEffect, useRef } from 'react'
import { catById } from '../lib/constantes'
import { fmt, fmtK } from '../lib/format'
import type { GastoCategoria } from '../lib/finanzas'
import { useApp } from '../store/AppContext'

/** Donut de gastos por categoría dibujado en canvas (como el prototipo). */
export function DonutChart({ datos }: { datos: GastoCategoria[] }) {
  const { estado } = useApp()
  const ref = useRef<HTMLCanvasElement>(null)
  const total = datos.reduce((s, d) => s + d.total, 0)
  const cat = (id: string) => catById(id, estado.categorias)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 120, 120)

    if (total === 0) {
      ctx.beginPath()
      ctx.arc(60, 60, 46, 0, 2 * Math.PI)
      ctx.lineWidth = 16
      ctx.strokeStyle = '#E4E6E2'
      ctx.stroke()
      return
    }

    let ang = -Math.PI / 2
    for (const d of datos) {
      const frac = d.total / total
      const a2 = ang + frac * 2 * Math.PI
      ctx.beginPath()
      ctx.arc(60, 60, 46, ang, a2)
      ctx.lineWidth = 16
      ctx.strokeStyle = cat(d.cat).color
      ctx.lineCap = 'butt'
      ctx.stroke()
      ang = a2
    }
    ctx.fillStyle = '#1A1E1C'
    ctx.font = '600 15px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(fmtK(total), 60, 56)
    ctx.fillStyle = '#6B7270'
    ctx.font = '400 9px sans-serif'
    ctx.fillText('este mes', 60, 70)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos, total, estado.categorias])

  return (
    <div className="flex items-center gap-4">
      <canvas ref={ref} width={120} height={120} className="flex-shrink-0" />
      <div className="flex-1">
        {total === 0 ? (
          <div className="text-[12.5px] text-gris-claro">Sin gastos este mes todavía.</div>
        ) : (
          datos.map((d) => {
            const c = cat(d.cat)
            const pct = Math.round((d.total / total) * 100)
            return (
              <div key={d.cat} className="mb-1.5 flex items-center gap-2 text-[12.5px]">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]"
                  style={{ background: c.color }}
                />
                {c.nombre}
                <span className="ml-auto font-semibold">
                  {fmt(d.total)} · {pct}%
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
